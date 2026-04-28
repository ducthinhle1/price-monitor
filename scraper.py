import re
import time
import random
import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0",
}


def detect_store(url: str) -> str:
    if "amazon.com" in url:
        return "amazon"
    elif "target.com" in url:
        return "target"
    elif "ebay.com" in url:
        return "ebay"
    return "other"


def parse_price(text: str) -> float | None:
    text = text.replace(",", "").strip()
    match = re.search(r"\d+\.?\d*", text)
    if match:
        try:
            return float(match.group())
        except ValueError:
            pass
    return None


def _get_amazon_price(soup: BeautifulSoup) -> float | None:
    selectors = [
        ("span", {"class": "a-price-whole"}),
        ("span", {"id": "priceblock_ourprice"}),
        ("span", {"id": "priceblock_dealprice"}),
        ("span", {"class": "a-offscreen"}),
    ]
    for tag, attrs in selectors:
        el = soup.find(tag, attrs)
        if el:
            price = parse_price(el.get_text())
            if price:
                return price
    return None


def _get_target_price(url: str) -> float | None:
    # Try private JSON API first
    match = re.search(r"/-/A-(\d+)", url)
    if match:
        tcin = match.group(1)
        api_url = (
            f"https://redsky.target.com/redsky_aggregations/v1/web/pdp_client_v1"
            f"?key=9f36aeafbe60771e321a7cc95a78140772ab3e96"
            f"&tcin={tcin}&store_id=1000&pricing_store_id=1000"
        )
        try:
            r = requests.get(api_url, headers={
                "User-Agent": HEADERS["User-Agent"],
                "Accept": "application/json",
                "Referer": "https://www.target.com/",
                "Origin": "https://www.target.com",
            }, timeout=15)
            r.raise_for_status()
            price = (r.json()
                     .get("data", {})
                     .get("product", {})
                     .get("price", {})
                     .get("current_retail"))
            if price is not None:
                return float(price)
            # Products with variants use current_retail_min
            price_min = (r.json()
                         .get("data", {})
                         .get("product", {})
                         .get("price", {})
                         .get("current_retail_min"))
            if price_min is not None:
                return float(price_min)
        except Exception as e:
            print(f"  Target API error: {e}")

    # Fallback: scrape HTML product page
    print("  Falling back to Target HTML scrape…")
    try:
        time.sleep(random.uniform(2, 5))
        r = requests.get(url, headers=HEADERS, timeout=20)
        r.raise_for_status()
        soup = BeautifulSoup(r.content, "lxml")

        # data-test="product-price" span
        el = soup.find(attrs={"data-test": "product-price"})
        if el:
            price = parse_price(el.get_text())
            if price:
                return price

        # JSON-LD structured data
        import json
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                data = json.loads(script.string or "")
                offers = data.get("offers", {})
                if isinstance(offers, list):
                    offers = offers[0]
                p = offers.get("price")
                if p:
                    return float(p)
            except Exception:
                pass

        # __TGT_DATA__ embedded JSON
        tgt_match = re.search(r'"current_retail"\s*:\s*(\d+\.?\d*)', r.text)
        if tgt_match:
            return float(tgt_match.group(1))

    except Exception as e:
        print(f"  Target HTML scrape error: {e}")

    return None


def _get_ebay_price_api(item_id: str) -> float | None:
    """Use eBay Browse API — requires EBAY_APP_ID env var."""
    import os
    app_id = os.getenv("EBAY_APP_ID")
    if not app_id:
        return None
    try:
        r = requests.get(
            f"https://api.ebay.com/buy/browse/v1/item/v1|{item_id}|0",
            headers={
                "Authorization": f"Bearer {app_id}",
                "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
                "Content-Type": "application/json",
            },
            timeout=15,
        )
        if r.status_code == 200:
            data = r.json()
            price = data.get("price", {}).get("value")
            if price:
                return float(price)
    except Exception as e:
        print(f"  eBay API error: {e}")
    return None


def _get_ebay_price(item_id: str) -> float | None:
    price = _get_ebay_price_api(item_id)
    if price is not None:
        return price
    # eBay blocks HTML scraping via Akamai bot detection —
    # set EBAY_APP_ID in your environment to enable price fetching.
    print("  eBay: no EBAY_APP_ID set, cannot fetch price")
    return None


def scrape_price(url: str) -> float | None:
    store = detect_store(url)

    if store == "target":
        return _get_target_price(url)

    if store == "ebay":
        m = re.search(r"/itm/(?:[^/]+/)?(\d+)", url)
        item_id = m.group(1) if m else None
        if not item_id:
            print("  eBay: could not extract item ID from URL")
            return None
        return _get_ebay_price(item_id)

    for attempt in range(3):
        try:
            time.sleep(random.uniform(3, 7))
            response = requests.get(url, headers=HEADERS, timeout=15)
            response.raise_for_status()

            if store == "amazon" and "api-services-support@amazon.com" in response.text:
                print(f"  Amazon CAPTCHA (attempt {attempt + 1}/3)")
                continue

            soup = BeautifulSoup(response.content, "lxml")
            price = _get_amazon_price(soup) if store == "amazon" else None

            if store == "other":
                for el in soup.find_all(["span", "div"], class_=lambda c: c and "price" in c.lower()):
                    price = parse_price(el.get_text())
                    if price and 0.5 < price < 100000:
                        break

            if price:
                return price
            print(f"  Price not found (attempt {attempt + 1}/3)")

        except requests.RequestException as e:
            print(f"  Request failed: {e} (attempt {attempt + 1}/3)")

    return None
