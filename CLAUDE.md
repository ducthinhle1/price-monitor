# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app locally

```bash
pip install -r requirements.txt
python -m playwright install chromium
python -m uvicorn app:app --reload --port 8080
```

The server starts at `http://127.0.0.1:8080`. Port 8000 is often blocked on this machine — use 8080 or any other free port.

Playwright must be installed separately after pip (`python -m playwright install chromium`) because it downloads the Chromium browser binary (~130 MB), not just a Python package.

The SQLite database (`prices.db`) is created automatically on first run via `init_db()`. Credentials are read from environment variables (see `.env`); `init_db` seeds empty defaults if vars are unset.

## Environment variables

Stored in `.env` locally, and in Railway's Variables tab for deployment. See `.env` for the full list. Key vars: `DISCORD_WEBHOOK`, `SENDER_EMAIL`, `GMAIL_PASSWORD`, `RECEIVER_EMAIL`, `CHECK_HOUR`, `EBAY_APP_ID` (optional).

## Deployment (Railway)

The `Procfile` handles deployment:
```
web: playwright install chromium --with-deps && uvicorn app:app --host 0.0.0.0 --port $PORT
```
`--with-deps` installs Linux system libraries required by Chromium on Railway's containers.

## Architecture

Five source files, no framework beyond FastAPI:

| File | Role |
|------|------|
| `app.py` | FastAPI routes, APScheduler setup, Jinja2 env, icon helper, `run_all_checks` |
| `database.py` | SQLAlchemy models (`Product`, `PriceCheck`, `Setting`), `init_db`, `get_setting` |
| `scraper.py` | Per-store price fetching with Playwright browser |
| `notifier.py` | Discord webhook embed + Gmail SMTP daily report |
| `templates/` | Jinja2 templates extending `base.html` |

### Request flow

```
Browser → FastAPI route → Session(engine) query → TemplateResponse
                       ↘ APScheduler (cron, ET timezone) → run_all_checks()
                                                          → launches Playwright browser
                                                          → scraper.scrape_price(url, page)
                                                          → notifier.send_discord/send_email()
```

### Key patterns

**Jinja2 environment** — configured with a custom `icon()` global (returns `Markup` SVG), a `zfill` filter, and a `to_et_str` filter (converts naive UTC datetime → ET string). Always use `_jinja_env` (not a fresh `Jinja2Templates`). `TemplateResponse` uses the Starlette 1.0 signature: `(request, "template.html", context_dict)`.

**Thread safety** — `run_all_checks` is guarded by `_check_lock` (a `threading.Lock`) acquired with `blocking=False`. APScheduler thread and the manual `/check` background task both go through this lock.

**Settings** — key/value rows in the `settings` table. Setting key is `check_hour` (stores ET hour). `_base_ctx()` injects `check_hour` into every route. Changing `check_hour` reschedules the APScheduler job live. Scheduler timezone is `America/New_York`.

**Flash messages** — all mutating routes redirect with `?msg=added|deleted|edited|saved|checking`. `base.html` reads this on load and shows a toast.

**Product notifications** — `run_all_checks` sends ALL successfully-scraped products in the daily report (not just target hits). Each report item has a `hit: bool` flag. Discord embed and email show target progress per product.

**Open redirect protection** — `_safe_redirect(url)` in `app.py` ensures `next_url` form fields only redirect to relative paths starting with `/`.

### Scraper architecture (scraper.py)

Price fetching uses a **Playwright headless Chromium browser** launched once per check run in `run_all_checks`, shared across all products as separate tabs (`ctx.new_page()`).

**Per-store strategy:**
- **Target** — tries `redsky.target.com` JSON API first (fast, no browser). Checks both `current_retail` and `current_retail_min` (variant products use the latter). Falls back to Playwright if API fails.
- **Amazon** — goes straight to Playwright. Requires: (1) warmup visit to `amazon.com` before the product loop to get cookies; (2) detecting and clicking the "Continue shopping" bot-check interstitial using `page.expect_navigation()`.
- **eBay** — tries official Browse API if `EBAY_APP_ID` env var is set (free, 5000/day from developer.ebay.com). Falls back to Playwright.

**Why Playwright and not `requests`:**
- Amazon blocks Python HTTP requests via TLS fingerprint detection (not just user-agent)
- eBay uses Akamai bot manager that blocks `requests` regardless of headers
- Playwright launches a real Chromium browser — websites see a real browser

**Anti-detection setup in `run_all_checks`:**
```python
args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"]
ctx.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
```

`scrape_price(url, page=None)` returns `None` on failure — callers must handle this.

### Template structure

All templates extend `base.html`, which provides the CSS design system, responsive sidebar (hamburger drawer on mobile), Add/Edit modals, and toast JS.

**Responsive breakpoints:** `@media (max-width: 900px)` collapses sidebar to a slide-out drawer with overlay; `@media (max-width: 480px)` tightens spacing further.

Dashboard JS handles layout toggle (cards ↔ table, persisted to `localStorage`), live search/filter, and polling `/check/status` when a check is running.

Product detail uses Chart.js 4 with a dashed target-price reference line (constant array dataset).

Settings hour grid is ET-based. The `now` class (orange ring) is server-computed using `datetime.now(NY_TZ).hour`.
