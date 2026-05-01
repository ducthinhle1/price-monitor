import json
import os
import random
import re
import time

import requests

# ── What is this file? ───────────────────────────────────────────────────────
# This file's only job: given a product URL, return the current price as a
# float (e.g. 24.99) or None if we couldn't get it.
#
# HOW PRICES ARE FETCHED:
#   Target  → tries its private JSON API first (fast, no browser needed),
#              falls back to Playwright browser if that fails
#   Amazon  → goes straight to Playwright (Amazon blocks plain HTTP requests)
#   eBay    → tries official Browse API if you have an app key,
#              falls back to Playwright
#   Other   → Playwright


def detect_store(url: str) -> str:
    if "amazon.com" in url:
        return "amazon"
    if "target.com" in url:
        return "target"
    if "ebay.com" in url:
        return "ebay"
    return "other"


def parse_price(text: str) -> float | None:
    """Pull the first number that looks like a price out of a string."""
    text = text.replace(",", "").strip()
    match = re.search(r"\d+\.\d{2}", text)   # prefer xx.xx format
    if not match:
        match = re.search(r"\d+\.?\d*", text)  # fallback: any number
    if match:
        try:
            val = float(match.group())
            # Sanity check: prices should be between $0.01 and $100,000
            if 0.01 < val < 100_000:
                return val
        except ValueError:
            pass
    return None


# ── Target: fast API path ─────────────────────────────────────────────────────
# Target exposes a private JSON endpoint (redsky.target.com) that returns
# structured product data — no browser needed, very fast.
# Works from residential IPs but often blocked on cloud server IPs.

def _target_api_price(url: str) -> float | None:
    match = re.search(r"/-/A-(\d+)", url)
    if not match:
        return None
    tcin = match.group(1)
    api_url = (
        f"https://redsky.target.com/redsky_aggregations/v1/web/pdp_client_v1"
        f"?key=9f36aeafbe60771e321a7cc95a78140772ab3e96"
        f"&tcin={tcin}&store_id=1000&pricing_store_id=1000"
    )
    try:
        r = requests.get(api_url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
            "Referer": "https://www.target.com/",
            "Origin": "https://www.target.com",
        }, timeout=10)
        r.raise_for_status()
        price_obj = r.json().get("data", {}).get("product", {}).get("price", {})
        # current_retail = single price, current_retail_min = lowest price for variants
        price = price_obj.get("current_retail") or price_obj.get("current_retail_min")
        return float(price) if price is not None else None
    except Exception as e:
        print(f"  Target API error: {e}")
        return None


# ── eBay: official Browse API ─────────────────────────────────────────────────
# eBay's API is free (5,000 calls/day) but requires registering for an App ID.
# Set EBAY_APP_ID in your .env or Railway environment variables to enable this.

def _ebay_api_price(item_id: str) -> float | None:
    app_id = os.getenv("EBAY_APP_ID")
    if not app_id:
        return None
    try:
        r = requests.get(
            f"https://api.ebay.com/buy/browse/v1/item/v1|{item_id}|0",
            headers={
                "Authorization": f"Bearer {app_id}",
                "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
            },
            timeout=15,
        )
        if r.status_code == 200:
            price = r.json().get("price", {}).get("value")
            return float(price) if price else None
    except Exception as e:
        print(f"  eBay API error: {e}")
    return None


# ── Playwright: real browser scraping ─────────────────────────────────────────
# A Playwright "page" is a real Chrome tab. We visit the URL just like you
# would in your browser, wait for the price element to appear, then read it.
# This bypasses bot detection because it IS a real browser.

def _browser_price(page, url: str, store: str) -> float | None:
    try:
        # Visit the page — "domcontentloaded" means we don't wait for every
        # image/ad to load, just the main HTML and JavaScript
        page.goto(url, wait_until="domcontentloaded", timeout=30_000)

        # Small random pause — looks more human
        time.sleep(random.uniform(1.5, 3.0))

        if store == "amazon":
            # Amazon sometimes shows a "Click to continue shopping" interstitial
            # before letting you see the product — it's a bot check.
            # We detect it by looking for a submit button, click it, then proceed.
            btn = page.query_selector("input[type=submit], button:has-text('Continue')")
            if btn:
                print("  Amazon bot check detected — clicking through…")
                with page.expect_navigation(wait_until="domcontentloaded", timeout=15_000):
                    btn.click()
                time.sleep(2)

            # .a-offscreen is Amazon's accessibility price — always present,
            # contains the full price string like "$24.99"
            try:
                page.wait_for_selector(".a-offscreen, .a-price-whole", timeout=12_000)
            except Exception:
                pass
            for sel in [".a-offscreen", ".a-price-whole", "#priceblock_ourprice"]:
                el = page.query_selector(sel)
                if el:
                    price = parse_price(el.inner_text())
                    if price:
                        return price

        elif store == "target":
            try:
                page.wait_for_selector("[data-test='product-price']", timeout=8_000)
            except Exception:
                pass
            el = page.query_selector("[data-test='product-price']")
            if el:
                price = parse_price(el.inner_text())
                if price:
                    return price

        elif store == "ebay":
            try:
                page.wait_for_selector("[itemprop='price'], .x-price-primary", timeout=8_000)
            except Exception:
                pass
            # itemprop="price" has a content attribute with the raw number — most reliable
            el = page.query_selector("[itemprop='price']")
            if el:
                content = el.get_attribute("content")
                if content:
                    try:
                        return float(content)
                    except ValueError:
                        pass
            el = page.query_selector(".x-price-primary")
            if el:
                price = parse_price(el.inner_text())
                if price:
                    return price

        else:
            # Unknown store: look for any element whose CSS class contains "price"
            for el in page.query_selector_all("[class*='price']"):
                price = parse_price(el.inner_text())
                if price:
                    return price

        print(f"  Price element not found on page")

    except Exception as e:
        print(f"  Browser error ({store}): {e}")

    return None


# ── Main entry point ──────────────────────────────────────────────────────────

def scrape_price(url: str, page=None) -> float | None:
    """
    Fetch the current price for a product URL.
    Pass a Playwright page object for browser-based scraping.
    """
    store = detect_store(url)
    print(f"  Store: {store}")

    # Target: try the fast API first
    if store == "target":
        price = _target_api_price(url)
        if price is not None:
            print(f"  Target API: ${price:.2f}")
            return price
        print("  Target API failed — falling back to browser")

    # eBay: try official API if key is configured
    if store == "ebay":
        m = re.search(r"/itm/(?:[^/]+/)?(\d+)", url)
        if m:
            price = _ebay_api_price(m.group(1))
            if price is not None:
                print(f"  eBay API: ${price:.2f}")
                return price
        print("  eBay API unavailable — falling back to browser")

    # Everything else (and fallbacks above) uses the browser
    if page is not None:
        return _browser_price(page, url, store)

    print(f"  No browser available and API failed for {store}")
    return None
