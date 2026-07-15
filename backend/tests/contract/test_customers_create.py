from fastapi.testclient import TestClient

from src.core.db import get_session
from src.main import app


def _client(db_session):
    app.dependency_overrides[get_session] = lambda: db_session
    return TestClient(app)


def _valid_payload(**overrides):
    payload = dict(
        customer_name="Acme Co",
        customer_type="Company",
        opening_balance="100.00",
        balance_type="Debit",
        currency="AED",
        status="Active",
    )
    payload.update(overrides)
    return payload


def test_create_customer_returns_201_and_a_customer_read_shape(db_session):
    client = _client(db_session)
    try:
        response = client.post("/api/customers", json=_valid_payload())
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 201
    body = response.json()
    assert body["customer_code"].startswith("CUS")
    assert body["customer_name"] == "Acme Co"
    assert body["opening_balance"] == "100.00"
    assert body["status"] == "Active"
    assert "id" in body
    assert "created_at" in body
    assert "updated_at" in body


def test_create_customer_missing_required_field_returns_400(db_session):
    client = _client(db_session)
    payload = _valid_payload()
    del payload["customer_name"]
    try:
        response = client.post("/api/customers", json=payload)
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 400
