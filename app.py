import threading
from contextlib import asynccontextmanager
from datetime import datetime

import pytz
from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import BackgroundTasks, FastAPI, Form, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from jinja2 import Environment, FileSystemLoader
from markupsafe import Markup
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import PriceCheck, Product, Setting, engine, get_setting, init_db
from notifier import send_discord, send_email
from scraper import detect_store, scrape_price

# ─── SVG icon helper (registered as Jinja2 global) ───────────────────────────

_ICON_PATHS = {
    "dashboard": '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    "bell": '<path d="M6 8a6 6 0 1 1 12 0c0 5 1.5 6 2 7H4c.5-1 2-2 2-7z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
    "settings": '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    "plus": '<path d="M12 5v14M5 12h14"/>',
    "refresh": '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
    "search": '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    "arrowDown": '<path d="M12 5v14M5 12l7 7 7-7"/>',
    "arrowUp": '<path d="M12 19V5M5 12l7-7 7 7"/>',
    "arrowRight": '<path d="M5 12h14M12 5l7 7-7 7"/>',
    "arrowLeft": '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    "trash": '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/>',
    "edit": '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>',
    "external": '<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
    "check": '<path d="m4 12 5 5 11-12"/>',
    "x": '<path d="M18 6 6 18M6 6l12 12"/>',
    "target": '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
    "eye": '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    "eyeOff": '<path d="m3 3 18 18"/><path d="M10.6 6.2A9.7 9.7 0 0 1 12 6c6.5 0 10 6 10 6a17.8 17.8 0 0 1-3.2 4M6.6 6.6A17.8 17.8 0 0 0 2 12s3.5 6 10 6a9.7 9.7 0 0 0 4-.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    "mail": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    "discord": '<path d="M8 7c-2 .5-3.5 1.5-3.5 1.5C3 11 2.5 15 3 18c1.5 1 3 1.5 4.5 2l1-2c-.5-.2-1-.5-1.5-1 2 1 5.5 1 8 0-.5.5-1 .8-1.5 1l1 2c1.5-.5 3-1 4.5-2 .5-3 0-7-1.5-9.5 0 0-1.5-1-3.5-1.5l-1 2c-1.5-.3-3-.3-4.5 0z"/><circle cx="9" cy="13" r="1" fill="currentColor"/><circle cx="15" cy="13" r="1" fill="currentColor"/>',
    "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    "zap": '<path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="currentColor" stroke="none"/>',
    "filter": '<path d="M3 5h18M6 12h12M10 19h4"/>',
    "copy": '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    "chart": '<path d="M3 3v18h18"/><path d="m7 15 4-5 4 3 5-7"/>',
    "more": '<circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
}


def _icon(name, size=18, stroke=1.8):
    paths = _ICON_PATHS.get(name, "")
    return Markup(
        f'<svg viewBox="0 0 24 24" width="{size}" height="{size}" fill="none" '
        f'stroke="currentColor" stroke-width="{stroke}" stroke-linecap="round" '
        f'stroke-linejoin="round" style="display:inline-block;vertical-align:middle;flex-shrink:0">'
        f'{paths}</svg>'
    )


NY_TZ = pytz.timezone("America/New_York")


def _to_et_str(dt):
    if dt is None:
        return ""
    utc_dt = pytz.utc.localize(dt) if dt.tzinfo is None else dt
    et_dt = utc_dt.astimezone(NY_TZ)
    return et_dt.strftime("%b %d, %Y · %H:%M ET")


def _safe_redirect(url: str) -> str:
    if url and url.startswith("/") and not url.startswith("//"):
        return url
    return "/"


_jinja_env = Environment(loader=FileSystemLoader("templates"), cache_size=0, autoescape=True)
_jinja_env.globals["icon"] = _icon
_jinja_env.filters["zfill"] = lambda s, w=2: str(int(s)).zfill(w)
_jinja_env.filters["to_et_str"] = _to_et_str
templates = Jinja2Templates(env=_jinja_env)

scheduler = BackgroundScheduler(timezone=NY_TZ)
_check_lock = threading.Lock()
check_status = {"running": False, "last_run": None}


def _base_ctx():
    with Session(engine) as session:
        hour = get_setting(session, "check_hour", "9")
    return {"check_hour": hour}


# ─── Price check logic ────────────────────────────────────────────────────────

def run_all_checks():
    if not _check_lock.acquire(blocking=False):
        return
    check_status["running"] = True
    try:
        with Session(engine) as session:
            products = session.query(Product).all()
            discord_webhook = get_setting(session, "discord_webhook")
            sender   = get_setting(session, "sender_email")
            password = get_setting(session, "gmail_password")
            receiver = get_setting(session, "receiver_email")

            report = []
            for product in products:
                print(f"Checking: {product.name}")
                current_price = scrape_price(product.url)
                if current_price is None:
                    print(f"  Could not retrieve price")
                    continue

                last = (session.query(PriceCheck)
                        .filter_by(product_id=product.id)
                        .order_by(PriceCheck.checked_at.desc())
                        .first())
                previous_price = last.price if last else None

                session.add(PriceCheck(product_id=product.id, price=current_price))
                session.commit()

                if product.target_price is None or current_price <= product.target_price:
                    report.append({
                        "name": product.name,
                        "url": product.url,
                        "previous_price": previous_price,
                        "current_price": current_price,
                        "target_price": product.target_price,
                    })
                print(f"  ${current_price:.2f}")

            if report:
                send_discord(discord_webhook, report)
                send_email(sender, password, receiver, report)

        check_status["last_run"] = datetime.now(NY_TZ)
    finally:
        check_status["running"] = False
        _check_lock.release()


# ─── App lifespan ─────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    with Session(engine) as session:
        hour = int(get_setting(session, "check_hour", "9"))
    scheduler.add_job(run_all_checks, "cron", hour=hour, minute=0, id="daily_check")
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(lifespan=lifespan)


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
def dashboard(request: Request):
    with Session(engine) as session:
        products = session.query(Product).order_by(Product.created_at).all()
        rows = []
        for p in products:
            checks = (session.query(PriceCheck)
                      .filter_by(product_id=p.id)
                      .order_by(PriceCheck.checked_at.desc())
                      .limit(2).all())
            current  = checks[0].price if checks else None
            previous = checks[1].price if len(checks) > 1 else None
            last_checked = checks[0].checked_at if checks else None

            target_pct = None
            if p.target_price and current and previous:
                span = max(previous - p.target_price, 0.01)
                remaining = max(0, current - p.target_price)
                target_pct = max(0, min(100, 100 - (remaining / span) * 100))

            rows.append({
                "id": p.id, "name": p.name, "url": p.url,
                "store": p.store, "target_price": p.target_price,
                "current": current, "previous": previous,
                "last_checked": last_checked,
                "target_pct": target_pct,
            })

    hits_count  = sum(1 for r in rows if r["target_price"] and r["current"] and r["current"] <= r["target_price"])
    drops_count = sum(1 for r in rows if r["current"] and r["previous"] and r["current"] < r["previous"])

    return templates.TemplateResponse(request, "dashboard.html", {
        **_base_ctx(),
        "products": rows,
        "checking": check_status["running"],
        "last_run": check_status["last_run"],
        "hits_count": hits_count,
        "drops_count": drops_count,
    })


@app.post("/products/add")
def add_product(
    name: str = Form(...),
    url: str = Form(...),
    target_price: str = Form(""),
):
    tp = float(target_price) if target_price.strip() else None
    with Session(engine) as session:
        existing = session.query(Product).filter_by(url=url.strip()).first()
        if not existing:
            session.add(Product(
                name=name.strip(),
                url=url.strip(),
                store=detect_store(url),
                target_price=tp,
            ))
            session.commit()
    return RedirectResponse("/?msg=added", status_code=303)


@app.post("/products/{product_id}/edit")
def edit_product(
    product_id: int,
    name: str = Form(...),
    target_price: str = Form(""),
    next_url: str = Form("/"),
):
    tp = float(target_price) if target_price.strip() else None
    with Session(engine) as session:
        product = session.get(Product, product_id)
        if product:
            product.name = name.strip()
            product.target_price = tp
            session.commit()
    safe = _safe_redirect(next_url)
    sep = "&" if "?" in safe else "?"
    return RedirectResponse(f"{safe}{sep}msg=edited", status_code=303)


@app.post("/products/{product_id}/delete")
def delete_product(product_id: int):
    with Session(engine) as session:
        product = session.get(Product, product_id)
        if product:
            session.delete(product)
            session.commit()
    return RedirectResponse("/?msg=deleted", status_code=303)


@app.get("/products/{product_id}", response_class=HTMLResponse)
def product_detail(request: Request, product_id: int):
    with Session(engine) as session:
        product = session.get(Product, product_id)
        if not product:
            return RedirectResponse("/")
        checks = (session.query(PriceCheck)
                  .filter_by(product_id=product_id)
                  .order_by(PriceCheck.checked_at.asc())
                  .all())
        current  = checks[-1].price if checks else None
        previous = checks[-2].price if len(checks) > 1 else None
        low_price = (session.query(func.min(PriceCheck.price))
                     .filter_by(product_id=product_id).scalar())
        checks_count = len(checks)
        chart_labels = [c.checked_at.strftime("%b %d") for c in checks]
        chart_prices = [c.price for c in checks]
        history = list(reversed(checks))

    return templates.TemplateResponse(request, "product.html", {
        **_base_ctx(),
        "product": {
            "id": product.id, "name": product.name,
            "url": product.url, "store": product.store,
            "target_price": product.target_price,
            "created_at": product.created_at,
        },
        "current": current,
        "previous": previous,
        "low_price": low_price,
        "checks_count": checks_count,
        "chart_labels": chart_labels,
        "chart_prices": chart_prices,
        "history": history,
    })


@app.post("/check")
def check_now(background_tasks: BackgroundTasks):
    if not check_status["running"]:
        background_tasks.add_task(run_all_checks)
    return RedirectResponse("/?msg=checking", status_code=303)


@app.get("/check/status")
def check_status_api():
    return JSONResponse({
        "running": check_status["running"],
        "last_run": check_status["last_run"].isoformat() if check_status["last_run"] else None,
    })


@app.get("/settings", response_class=HTMLResponse)
def settings_page(request: Request):
    with Session(engine) as session:
        ctx = {
            "discord_webhook": get_setting(session, "discord_webhook"),
            "sender_email":    get_setting(session, "sender_email"),
            "gmail_password":  get_setting(session, "gmail_password"),
            "receiver_email":  get_setting(session, "receiver_email"),
            "check_hour":      get_setting(session, "check_hour", "9"),
        }
    return templates.TemplateResponse(request, "settings.html", {
        **_base_ctx(), **ctx,
        "now_hour": datetime.now(NY_TZ).hour,
    })


@app.post("/settings")
def save_settings(
    discord_webhook: str = Form(""),
    sender_email:    str = Form(""),
    gmail_password:  str = Form(""),
    receiver_email:  str = Form(""),
    check_hour:      str = Form("14"),
):
    with Session(engine) as session:
        for key, value in [
            ("discord_webhook", discord_webhook),
            ("sender_email",    sender_email),
            ("gmail_password",  gmail_password),
            ("receiver_email",  receiver_email),
            ("check_hour",      check_hour),
        ]:
            s = session.get(Setting, key)
            if s:
                s.value = value
            else:
                session.add(Setting(key=key, value=value))
        session.commit()

    if scheduler.get_job("daily_check"):
        scheduler.reschedule_job("daily_check", trigger="cron",
                                 hour=int(check_hour), minute=0)

    return RedirectResponse("/settings?msg=saved", status_code=303)
