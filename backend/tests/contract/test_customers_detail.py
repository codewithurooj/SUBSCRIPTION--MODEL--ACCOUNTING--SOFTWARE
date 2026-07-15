from fastapi.testclient import TestClient

from src.core.db import get_session
from src.main import app


def _client(db_session):
    app.dependency_overrides[get_session] = lambda: db_session
    return TestClient(app)


def _create(client):
    payload = dict(
        customer_name="Acme Co",
        customer_type="Company",
        opening_balance="100.00",
        balance_type="Debit",
        currency="AED",
        status="Active",
    )
    response = client.post("/api/customers", json=payload)
    assert response.status_code == 201
    return response.json()


def test_get_customer_returns_200_and_a_customer_read_shape(db_session):
    client = _client(db_session)
    try:
        created = _create(client)
        response = client.get(f"/api/customers/{created['id']}")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_get_customer_returns_404_for_an_unknown_id(db_session):
    client = _client(db_session)
    try:
        response = client.get("/api/customers/999999")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 404
