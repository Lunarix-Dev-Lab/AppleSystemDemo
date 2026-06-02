import uuid

import pytest
from sqlalchemy import text

# Importar el módulo completo (no AsyncSessionLocal directamente)
# para que el cleanup use la versión parchada por conftest.patch_db
from app.core import database as _db


# ── Helpers ───────────────────────────────────────────────────────────────────

def _product_payload(**overrides) -> dict:
    return {
        "name": f"iPhone Test {uuid.uuid4().hex[:4]}",
        "description": "Producto de prueba",
        "price": 999999,
        "colors": ["Negro", "Blanco"],
        "storage_options": ["128GB"],
        "stock": 3,
        "is_active": True,
        **overrides,
    }


async def _cleanup_product(product_id: int):
    async with _db.AsyncSessionLocal() as db:
        await db.execute(text(f"DELETE FROM product_images WHERE product_id = {product_id}"))
        await db.execute(text(f"DELETE FROM products WHERE id = {product_id}"))
        await db.commit()


# ── Tests ─────────────────────────────────────────────────────────────────────

async def test_list_products_public(client):
    resp = await client.get("/api/v1/products")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


async def test_list_products_all(client):
    resp = await client.get("/api/v1/products?active_only=false")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


async def test_create_product_admin(client, admin_headers):
    payload = _product_payload()
    resp = await client.post("/api/v1/products", json=payload, headers=admin_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == payload["name"]
    assert data["stock"] == 3
    assert data["images"] == []

    await _cleanup_product(data["id"])


async def test_create_product_unauthorized(client):
    resp = await client.post("/api/v1/products", json=_product_payload())
    assert resp.status_code == 403


async def test_get_product_by_id(client, admin_headers):
    created = (await client.post(
        "/api/v1/products", json=_product_payload(), headers=admin_headers
    )).json()

    resp = await client.get(f"/api/v1/products/{created['id']}")
    assert resp.status_code == 200
    assert resp.json()["id"] == created["id"]

    await _cleanup_product(created["id"])


async def test_update_product_admin(client, admin_headers):
    created = (await client.post(
        "/api/v1/products", json=_product_payload(), headers=admin_headers
    )).json()

    resp = await client.put(
        f"/api/v1/products/{created['id']}",
        json={"stock": 99, "is_active": False},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["stock"] == 99
    assert data["is_active"] is False

    await _cleanup_product(created["id"])


async def test_update_product_unauthorized(client, admin_headers):
    created = (await client.post(
        "/api/v1/products", json=_product_payload(), headers=admin_headers
    )).json()

    resp = await client.put(f"/api/v1/products/{created['id']}", json={"stock": 0})
    assert resp.status_code == 403

    await _cleanup_product(created["id"])


async def test_delete_product_admin(client, admin_headers):
    created = (await client.post(
        "/api/v1/products", json=_product_payload(), headers=admin_headers
    )).json()

    resp = await client.delete(f"/api/v1/products/{created['id']}", headers=admin_headers)
    assert resp.status_code == 204

    # Ya no existe
    assert (await client.get(f"/api/v1/products/{created['id']}")).status_code == 404


async def test_delete_product_unauthorized(client, admin_headers):
    created = (await client.post(
        "/api/v1/products", json=_product_payload(), headers=admin_headers
    )).json()

    resp = await client.delete(f"/api/v1/products/{created['id']}")
    assert resp.status_code == 403

    await _cleanup_product(created["id"])
