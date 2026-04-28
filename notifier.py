import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from html import escape

import requests


def _store_label(url: str) -> str:
    if "amazon.com" in url:
        return "Amazon"
    if "target.com" in url:
        return "Target"
    if "ebay.com" in url:
        return "eBay"
    return "Store"


def _change_text(prev: float | None, curr: float) -> str:
    if prev is None:
        return "🆕 First check"
    if curr < prev:
        return f"📉 DROP −${prev - curr:.2f}"
    if curr > prev:
        return f"📈 RISE +${curr - prev:.2f}"
    return "✅ No change"


def send_discord(webhook_url: str, report: list[dict]):
    if not webhook_url or not report:
        return

    fields = []
    for item in report:
        store = _store_label(item["url"])
        change = _change_text(item.get("previous_price"), item["current_price"])
        hit_line = ""
        if item.get("hit"):
            hit_line = f"\n🎯 **Target hit!** (target was ${item['target_price']:.2f})"
        elif item.get("target_price"):
            gap = item["current_price"] - item["target_price"]
            hit_line = f"\n🎯 ${gap:.2f} above target (${item['target_price']:.2f})"
        fields.append({
            "name": ("🎯 " if item.get("hit") else "") + item["name"],
            "value": f"**${item['current_price']:.2f}** — {change}{hit_line}\n[View on {store}]({item['url']})",
            "inline": False,
        })

    payload = {
        "embeds": [{
            "title": f"🛒 Daily Price Report — {datetime.now().strftime('%b %d, %Y')}",
            "color": 3447003,
            "fields": fields,
            "footer": {"text": f"Checked {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}"},
        }]
    }

    try:
        r = requests.post(webhook_url, json=payload, timeout=10)
        r.raise_for_status()
        print("  ✅ Discord report sent")
    except Exception as e:
        print(f"  ❌ Discord failed: {e}")


def send_email(sender: str, password: str, receiver: str, report: list[dict]):
    if not sender or not password or not receiver or not report:
        return

    rows = ""
    for item in report:
        store = _store_label(item["url"])
        prev = item.get("previous_price")
        curr = item["current_price"]
        if prev is None:
            status = '<span style="color:#888;">First check</span>'
        elif curr < prev:
            status = f'<span style="color:green;">📉 DROP −${prev - curr:.2f}</span>'
        elif curr > prev:
            status = f'<span style="color:red;">📈 RISE +${curr - prev:.2f}</span>'
        else:
            status = '<span style="color:#888;">No change</span>'

        target_cell = ""
        if item.get("hit"):
            target_cell = '<span style="color:#E6722A;font-weight:600">🎯 Target hit!</span>'
        elif item.get("target_price"):
            gap = curr - item["target_price"]
            target_cell = f'<span style="color:#888">${gap:.2f} to go (${item["target_price"]:.2f})</span>'
        rows += f"""<tr style="{'background:#FBE3CF;' if item.get('hit') else ''}">
            <td style="padding:10px;border-bottom:1px solid #eee;"><b>{escape(item['name'])}</b></td>
            <td style="padding:10px;border-bottom:1px solid #eee;font-size:16px;"><b>${curr:.2f}</b></td>
            <td style="padding:10px;border-bottom:1px solid #eee;">{status}</td>
            <td style="padding:10px;border-bottom:1px solid #eee;">{target_cell}</td>
            <td style="padding:10px;border-bottom:1px solid #eee;">
                <a href="{escape(item['url'])}">View on {store}</a>
            </td>
        </tr>"""

    body = f"""<html><body style="font-family:Arial,sans-serif;color:#333;">
        <h2>🛒 Daily Price Report</h2>
        <table style="border-collapse:collapse;width:100%;max-width:650px;">
            <thead><tr style="background:#f5f5f5;">
                <th style="padding:10px;text-align:left;">Product</th>
                <th style="padding:10px;text-align:left;">Price</th>
                <th style="padding:10px;text-align:left;">Change</th>
                <th style="padding:10px;text-align:left;">Target</th>
                <th style="padding:10px;text-align:left;">Link</th>
            </tr></thead>
            <tbody>{rows}</tbody>
        </table>
        <p style="color:#888;font-size:12px;">
            Checked {datetime.now().strftime('%Y-%m-%d %H:%M')}
        </p>
    </body></html>"""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"🛒 Price Report — {datetime.now().strftime('%b %d, %Y')}"
    msg["From"] = sender
    msg["To"] = receiver
    msg.attach(MIMEText(body, "html"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(sender, password)
            server.sendmail(sender, receiver, msg.as_string())
        print("  ✅ Email sent")
    except Exception as e:
        print(f"  ❌ Email failed: {e}")
