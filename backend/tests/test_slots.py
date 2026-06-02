from datetime import date, timedelta


def _next_weekday(weekday: int) -> date:
    """Devuelve la próxima fecha del día de la semana indicado (0=Lun, 6=Dom)."""
    today = date.today()
    days_ahead = weekday - today.weekday()
    if days_ahead <= 0:
        days_ahead += 7
    return today + timedelta(days=days_ahead)


async def test_get_schedule_public(client, with_schedule):
    resp = await client.get("/api/v1/slots/schedule")
    assert resp.status_code == 200
    data = resp.json()
    assert "schedules" in data
    assert "config" in data
    assert len(data["schedules"]) == 7
    assert data["config"]["slot_duration_minutes"] == 30


async def test_get_slots_open_weekday(client, with_schedule):
    next_monday = _next_weekday(0)  # Lunes
    resp = await client.get(f"/api/v1/slots?date={next_monday}")
    assert resp.status_code == 200
    slots = resp.json()
    assert len(slots) > 0
    assert all("time" in s and "available" in s for s in slots)
    # 09:00 a 17:30 con 30 min = 18 slots
    assert len(slots) == 18


async def test_get_slots_saturday_shorter(client, with_schedule):
    next_saturday = _next_weekday(5)  # Sábado 10:00–14:00
    resp = await client.get(f"/api/v1/slots?date={next_saturday}")
    assert resp.status_code == 200
    slots = resp.json()
    assert len(slots) > 0
    # 10:00 a 13:30 = 8 slots
    assert len(slots) == 8
    assert slots[0]["time"] == "10:00"


async def test_get_slots_sunday_closed(client, with_schedule):
    next_sunday = _next_weekday(6)  # Domingo, is_active=False
    resp = await client.get(f"/api/v1/slots?date={next_sunday}")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_get_slots_past_date(client, with_schedule):
    resp = await client.get("/api/v1/slots?date=2020-01-01")
    assert resp.status_code == 200
    assert resp.json() == []


async def test_get_slots_invalid_date(client, with_schedule):
    resp = await client.get("/api/v1/slots?date=not-a-date")
    assert resp.status_code == 400
