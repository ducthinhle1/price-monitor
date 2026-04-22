# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

```bash
pip install -r requirements.txt
python -m uvicorn app:app --reload --port 8080
```

The server starts at `http://127.0.0.1:8080`. Port 8000 is often blocked on this machine — use 8080 or any other free port.

The SQLite database (`prices.db`) is created automatically on first run via `init_db()` in the lifespan handler. Default credentials (Discord webhook, Gmail) are seeded into the `settings` table on first run — see `database.py:init_db`.

## Architecture

Five files, no framework beyond FastAPI:

| File | Role |
|------|------|
| `app.py` | FastAPI routes, APScheduler setup, Jinja2 env, icon helper |
| `database.py` | SQLAlchemy models (`Product`, `PriceCheck`, `Setting`), `init_db`, `get_setting` |
| `scraper.py` | Per-store price fetching (`scrape_price`, `detect_store`) |
| `notifier.py` | Discord webhook embed + Gmail SMTP report |
| `templates/` | Jinja2 templates extending `base.html` |

### Request flow

```
Browser → FastAPI route → Session(engine) query → TemplateResponse
                       ↘ APScheduler (cron) → run_all_checks()
                                             → scraper.scrape_price()
                                             → notifier.send_discord/send_email()
```

### Key patterns

**Jinja2 environment** — configured with a custom `icon()` global (returns `Markup` SVG) and a `zfill` filter. Always use `_jinja_env` (not a fresh `Jinja2Templates(directory=...)`) so these stay registered. `TemplateResponse` uses the Starlette 1.0 signature: `(request, "template.html", context_dict)` — `request` is the first positional arg, not inside the context dict.

**Thread safety** — `run_all_checks` is guarded by `_check_lock` (a `threading.Lock`) acquired with `blocking=False`. The APScheduler background thread and the manual `/check` background task both go through this lock.

**Settings** — stored as key/value rows in the `settings` table, read via `get_setting(session, key, default)`. `_base_ctx()` is called in every route to inject `check_hour` for the sidebar. Changing `check_hour_utc` also reschedules the APScheduler job live.

**Flash messages** — all mutating routes redirect with `?msg=added|deleted|edited|saved|checking`. `base.html` reads this on load, strips it from the URL with `history.replaceState`, and shows a toast.

**Product notifications** — `run_all_checks` only includes a product in the Discord/email report when it has no `target_price`, or when `current_price <= target_price`. Products that haven't hit their target are silently skipped.

### Scraper notes

- Target uses a private JSON API (`redsky.target.com`) keyed off the TCIN extracted from the URL path (`/-/A-{tcin}`).
- Amazon and eBay use HTML scraping with a 3–7 s random delay and up to 3 retries. Amazon CAPTCHA detection checks for `api-services-support@amazon.com` in the response body.
- `scrape_price` returns `None` on failure — callers must handle this.

### Template structure

All templates extend `base.html`, which provides the full CSS design system, sidebar nav, Add/Edit product modals, and the toast JS. The `icon()` Jinja2 global is available in all templates without any import.

Dashboard JS (in `dashboard.html`) handles layout toggle (cards ↔ table, persisted to `localStorage`), live search/filter, and polling `/check/status` when a check is running.

Product detail uses Chart.js 4 with a second dataset (constant array) to render the dashed target-price reference line.

Settings hour grid updates a hidden `<input name="check_hour">` on click; the form POSTs normally.
