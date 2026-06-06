"""
Servicio de notificaciones: email (SMTP) y WhatsApp (Meta Cloud API).

Ambos son opt-in: si las variables de entorno están vacías, los mensajes
se loguean como [stub] sin enviar nada real, permitiendo desarrollo sin
credenciales externas.
"""

import logging
from dataclasses import dataclass
from datetime import datetime
from email.message import EmailMessage
from html import escape as _esc

import aiosmtplib

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_MONTHS = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]
_DAYS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]


# ── Data transfer object ───────────────────────────────────────────────────────

@dataclass
class AptNotif:
    """Datos planos de un turno para usar en background tasks."""
    guest_name: str
    guest_email: str
    guest_phone: str
    slot_datetime: datetime
    management_token: str
    product_name: str | None


# ── Internos ───────────────────────────────────────────────────────────────────

def _fmt(dt: datetime) -> tuple[str, str]:
    """Devuelve (fecha_es, hora)."""
    day = _DAYS[dt.weekday()].capitalize()
    month = _MONTHS[dt.month - 1]
    return f"{day} {dt.day} de {month} de {dt.year}", f"{dt.hour:02d}:{dt.minute:02d}"


def _build_html(
    badge: str,
    title: str,
    greeting: str,
    rows: list[tuple[str, str]],
    cta_label: str | None = None,
    cta_url: str | None = None,
    footer: str = "",
) -> str:
    detail_rows = "".join(
        f'<tr><td class="dl">{l}</td><td class="dv">{_esc(str(v))}</td></tr>'
        for l, v in rows
    )
    cta = (
        f'<div class="cta"><a href="{cta_url}" class="btn">{cta_label}</a></div>'
        if cta_url else ""
    )
    return f"""<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<style>
*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f7;color:#1d1d1f}}
.w{{max-width:560px;margin:40px auto;padding:0 16px}}
.c{{background:#fff;border-radius:18px;overflow:hidden}}
.h{{padding:32px 32px 24px;border-bottom:1px solid #f0f0f0}}
.badge{{display:inline-block;background:#f5f5f7;color:#6e6e73;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;padding:4px 10px;border-radius:20px;margin-bottom:12px}}
.title{{font-size:22px;font-weight:600}}
.b{{padding:24px 32px}}
.gr{{color:#6e6e73;margin-bottom:20px;font-size:15px;line-height:1.5}}
table{{width:100%;border-collapse:collapse}}
td{{padding:10px 0;border-bottom:1px solid #f5f5f7;font-size:14px}}
tr:last-child td{{border-bottom:none}}
.dl{{color:#6e6e73;width:40%}}
.dv{{font-weight:500;text-align:right}}
.cta{{padding:0 32px 32px}}
.btn{{display:inline-block;background:#000;color:#fff;text-decoration:none;font-size:14px;font-weight:500;padding:12px 24px;border-radius:10px}}
.footer{{padding:20px 32px;background:#f9f9f9;border-top:1px solid #f0f0f0;font-size:12px;color:#aeaeb2;line-height:1.5}}
</style></head><body>
<div class="w"><div class="c">
<div class="h"><div class="badge">{badge}</div><div class="title">{title}</div></div>
<div class="b"><p class="gr">{_esc(greeting)}</p><table>{detail_rows}</table></div>
{cta}
<div class="footer">{footer}</div>
</div></div></body></html>"""


async def _send_email(to: str, subject: str, html: str) -> None:
    cfg = get_settings()
    if not cfg.SMTP_HOST:
        logger.info("[EMAIL stub] → %s | %s", to, subject)
        return
    try:
        msg = EmailMessage()
        msg["From"] = cfg.SMTP_FROM or cfg.SMTP_USER
        msg["To"] = to
        msg["Subject"] = subject
        msg.set_content("Este email requiere un cliente con soporte HTML.")
        msg.add_alternative(html, subtype="html")
        await aiosmtplib.send(
            msg,
            hostname=cfg.SMTP_HOST,
            port=cfg.SMTP_PORT,
            username=cfg.SMTP_USER,
            password=cfg.SMTP_PASSWORD,
            start_tls=cfg.SMTP_TLS,
        )
        logger.info("[EMAIL] Enviado a %s", to)
    except Exception as exc:
        logger.error("[EMAIL] Error al enviar a %s: %s", to, exc)


async def _send_whatsapp(phone: str, text: str) -> None:
    cfg = get_settings()
    if not cfg.WHATSAPP_TOKEN or not cfg.WHATSAPP_PHONE_NUMBER_ID or not phone:
        logger.info("[WHATSAPP stub] → %s | %s", phone, text[:80])
        return
    import httpx

    url = (
        f"https://graph.facebook.com/{cfg.WHATSAPP_API_VERSION}"
        f"/{cfg.WHATSAPP_PHONE_NUMBER_ID}/messages"
    )
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "text",
        "text": {"body": text},
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                url,
                json=payload,
                headers={"Authorization": f"Bearer {cfg.WHATSAPP_TOKEN}"},
            )
            resp.raise_for_status()
            logger.info("[WHATSAPP] Enviado a %s", phone)
    except Exception as exc:
        logger.error("[WHATSAPP] Error al enviar a %s: %s", phone, exc)


# ── Notificaciones públicas ────────────────────────────────────────────────────

async def notify_created(apt: AptNotif, business_phone: str = "") -> None:
    """Confirmación al cliente + aviso por WA al dueño."""
    cfg = get_settings()
    date_str, time_str = _fmt(apt.slot_datetime)
    cancel_url = f"{cfg.FRONTEND_URL}/turnos/cancelar/{apt.management_token}"

    rows = [("Fecha", date_str), ("Horario", time_str)]
    if apt.product_name:
        rows.append(("Producto", apt.product_name))

    html = _build_html(
        badge="Confirmación",
        title="Tu turno fue reservado",
        greeting=f"Hola {apt.guest_name}, confirmamos tu turno. ¡Te esperamos en el local!",
        rows=rows,
        cta_label="Cancelar turno",
        cta_url=cancel_url,
        footer="Si no realizaste esta reserva, ignorá este mensaje.",
    )
    await _send_email(apt.guest_email, "Turno reservado ✓", html)

    # WhatsApp al dueño del local
    if business_phone:
        extra = f"\nProducto: {apt.product_name}" if apt.product_name else ""
        await _send_whatsapp(
            business_phone,
            f"📅 Nuevo turno\nCliente: {apt.guest_name} ({apt.guest_phone})\n"
            f"Fecha: {date_str} a las {time_str}{extra}",
        )


async def notify_cancelled(apt: AptNotif) -> None:
    """Cliente canceló su propio turno."""
    cfg = get_settings()
    date_str, time_str = _fmt(apt.slot_datetime)

    rows = [("Fecha", date_str), ("Horario", time_str)]
    if apt.product_name:
        rows.append(("Producto", apt.product_name))

    html = _build_html(
        badge="Cancelación",
        title="Tu turno fue cancelado",
        greeting=f"Hola {apt.guest_name}, tu turno fue cancelado correctamente.",
        rows=rows,
        cta_label="Reservar nuevo turno",
        cta_url=f"{cfg.FRONTEND_URL}/reservar",
        footer="Si querés hacer una nueva reserva, usá el botón de arriba.",
    )
    await _send_email(apt.guest_email, "Turno cancelado", html)


async def notify_cancelled_by_admin(apt: AptNotif, reason: str | None = None) -> None:
    """Admin canceló el turno del cliente (QA-ADM-005: incluir motivo si se provee)."""
    cfg = get_settings()
    date_str, time_str = _fmt(apt.slot_datetime)

    rows = [("Fecha", date_str), ("Horario", time_str)]
    if apt.product_name:
        rows.append(("Producto", apt.product_name))

    if reason:
        rows.append(("Motivo", reason))

    greeting = (
        f"Hola {apt.guest_name}, lamentamos informarte que el local tuvo que cancelar tu turno. "
        f"Podés reservar uno nuevo cuando quieras."
    )

    html = _build_html(
        badge="Turno cancelado",
        title="Tu turno fue cancelado por el local",
        greeting=greeting,
        rows=rows,
        cta_label="Reservar nuevo turno",
        cta_url=f"{cfg.FRONTEND_URL}/reservar",
        footer="Disculpá los inconvenientes. Esperamos verte pronto.",
    )
    await _send_email(apt.guest_email, "Tu turno fue cancelado por el local", html)


async def notify_confirmed_by_admin(apt: AptNotif) -> None:
    """Admin confirma el turno → se lo notifica al cliente."""
    cfg = get_settings()
    date_str, time_str = _fmt(apt.slot_datetime)
    cancel_url = f"{cfg.FRONTEND_URL}/turnos/cancelar/{apt.management_token}"

    rows = [("Fecha", date_str), ("Horario", time_str)]
    if apt.product_name:
        rows.append(("Producto", apt.product_name))

    html = _build_html(
        badge="Confirmado",
        title="Tu turno está confirmado",
        greeting=f"Hola {apt.guest_name}, el local confirmó tu turno. ¡Te esperamos!",
        rows=rows,
        cta_label="Cancelar turno",
        cta_url=cancel_url,
        footer="Para cancelar usá el botón de arriba.",
    )
    await _send_email(apt.guest_email, "Turno confirmado por el local", html)
