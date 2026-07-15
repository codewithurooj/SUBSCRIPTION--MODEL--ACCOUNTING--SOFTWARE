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


def test_patch_customer_returns_200_and_the_updated_customer_read(db_session):
    client = _client(db_session)
    try:
        created = _create(client)
        response = client.patch(
            f"/api/customers/{created['id']}", json={"contact_person": "Jane"}
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["contact_person"] == "Jane"


def test_patch_customer_with_invalid_enum_returns_400(db_session):
    client = _client(db_session)
    try:
        created = _create(client)
        response = client.patch(
            f"/api/customers/{created['id']}", json={"customer_type": "Nonprofit"}
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 400


def test_patch_unknown_customer_returns_404(db_session):
    client = _client(db_session)
    try:
        response = client.patch("/api/customers/999999", json={"contact_person": "Jane"})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 404
