from datetime import date, timedelta

from sqlalchemy import text

# Importar el módulo completo para que el cleanup use la versión parchada
from app.core import database as _db


def _next_weekday(weekday: int) -> date:
    today = date.today()
    days_ahead = weekday - today.weekday()
    if days_ahead <= 0:
        days_ahead += 7
    return today + timedelta(days=days_ahead)


def _booking_payload(**overrides) -> dict:
    next_tuesday = _next_weekday(1)  # Martes, dentro del horario
    return {
        "guest_name": "Juan Test",
        "guest_email": "juan.test@example.com",
        "guest_phone": "+5491112345678",
        "slot_datetime": f"{next_tuesday}T09:00:00",
        "notes": None,
        **overrides,
    }


async def _cleanup_appointments(*ids: int):
    if not ids:
        return
    async with _db.AsyncSessionLocal() as db:
        id_list = ",".join(str(i) for i in ids)
        await db.execute(text(f"DELETE FROM appointments WHERE id IN ({id_list})"))
        await db.commit()


# ── Crear turno ───────────────────────────────────────────────────────────────

async def test_create_appointment_valid(client, with_schedule):
    resp = await client.post("/api/v1/appointments", json=_booking_payload())
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "pending_confirmation"
    assert "management_token" in data
    assert len(data["management_token"]) == 32

    await _cleanup_appointments(data["id"])


async def test_create_appointment_past_date(client, with_schedule):
    resp = await client.post("/api/v1/appointments", json=_booking_payload(
        slot_datetime="2020-01-06T09:00:00"  # pasado (lunes)
    ))
    assert resp.status_code == 400


async def test_create_appointment_sunday_closed(client, with_schedule):
    next_sunday = _next_weekday(6)
    resp = await client.post("/api/v1/appointments", json=_booking_payload(
        slot_datetime=f"{next_sunday}T10:00:00"
    ))
    assert resp.status_code == 400


async def test_create_appointment_outside_hours(client, with_schedule):
    next_tuesday = _next_weekday(1)
    resp = await client.post("/api/v1/appointments", json=_booking_payload(
        slot_datetime=f"{next_tuesday}T22:00:00"
    ))
    assert resp.status_code == 400


async def test_slot_at_capacity(client, with_schedule):
    """Con max_per_slot=2: 2 reservas OK, la 3ra falla con 409."""
    payload = _booking_payload()
    ids = []
    for _ in range(2):
        r = await client.post("/api/v1/appointments", json=payload)
        assert r.status_code == 201
        ids.append(r.json()["id"])

    r3 = await client.post("/api/v1/appointments", json=payload)
    assert r3.status_code == 409

    await _cleanup_appointments(*ids)


# ── Por token ─────────────────────────────────────────────────────────────────

async def test_get_by_token_found(client, with_schedule):
    created = (await client.post("/api/v1/appointments", json=_booking_payload())).json()
    token = created["management_token"]

    resp = await client.get(f"/api/v1/appointments/by-token/{token}")
    assert resp.status_code == 200
    assert resp.json()["id"] == created["id"]

    await _cleanup_appointments(created["id"])


async def test_get_by_token_not_found(client):
    resp = await client.get("/api/v1/appointments/by-token/token_inexistente_abc")
    assert resp.status_code == 404


async def test_cancel_by_token(client, with_schedule):
    created = (await client.post("/api/v1/appointments", json=_booking_payload())).json()
    token = created["management_token"]

    resp = await client.post(f"/api/v1/appointments/cancel/{token}")
    assert resp.status_code == 200
    assert resp.json()["status"] == "cancelled"

    await _cleanup_appointments(created["id"])


async def test_cancel_already_cancelled(client, with_schedule):
    created = (await client.post("/api/v1/appointments", json=_booking_payload())).json()
    token = created["management_token"]

    await client.post(f"/api/v1/appointments/cancel/{token}")
    resp = await client.post(f"/api/v1/appointments/cancel/{token}")
    assert resp.status_code == 400

    await _cleanup_appointments(created["id"])


# ── Admin ─────────────────────────────────────────────────────────────────────

async def test_list_appointments_admin(client, admin_headers, with_schedule):
    created = (await client.post("/api/v1/appointments", json=_booking_payload())).json()

    resp = await client.get("/api/v1/appointments", headers=admin_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)

    await _cleanup_appointments(created["id"])


async def test_list_appointments_unauthorized(client):
    resp = await client.get("/api/v1/appointments")
    assert resp.status_code == 403


async def test_update_status_admin(client, admin_headers, with_schedule):
    created = (await client.post("/api/v1/appointments", json=_booking_payload())).json()

    resp = await client.put(
        f"/api/v1/appointments/{created['id']}/status",
        json={"status": "confirmed"},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "confirmed"

    await _cleanup_appointments(created["id"])
