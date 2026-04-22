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
            "User-Agent": HEADERS["User-Agent"],
            "Accept": "application/json",
            "Referer": "https://www.target.com/",
        }, timeout=15)
        r.raise_for_status()
        price = (r.json()
                 .get("data", {})
                 .get("product", {})
                 .get("price", {})
                 .get("current_retail"))
        return float(price) if price is not None else None
    except Exception as e:
        print(f"  Target API error: {e}")
        return None


def _get_ebay_price(soup: BeautifulSoup) -> float | None:
    selectors = [
        ("span", {"class": "x-price-primary"}),
        ("span", {"itemprop": "price"}),
        ("div",  {"class": "x-bin-price"}),
    ]
    for tag, attrs in selectors:
        el = soup.find(tag, attrs)
        if el:
            price = parse_price(el.get_text())
            if price:
                return price
    return None


def scrape_price(url: str) -> float | None:
    store = detect_store(url)

    if store == "target":
        return _get_target_price(url)

    for attempt in range(3):
        try:
            time.sleep(random.uniform(3, 7))
            response = requests.get(url, headers=HEADERS, timeout=15)
            response.raise_for_status()

            if store == "amazon" and "api-services-support@amazon.com" in response.text:
                print(f"  Amazon CAPTCHA (attempt {attempt + 1}/3)")
                continue

            soup = BeautifulSoup(response.content, "lxml")

            if store == "amazon":
                price = _get_amazon_price(soup)
            elif store == "ebay":
                price = _get_ebay_price(soup)
            else:
                price = None
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
