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


def test_allowed_field_edits_persist_and_refresh_updated_at(db_session):
    client = _client(db_session)
    try:
        created = _create(client)
        response = client.patch(
            f"/api/customers/{created['id']}",
            json={"contact_person": "Jane Doe", "credit_limit": "1000.00"},
        )
    finally:
        app.dependency_overrides.clear()

    body = response.json()
    assert body["contact_person"] == "Jane Doe"
    assert body["credit_limit"] == "1000.00"
    assert body["updated_at"] >= created["updated_at"]


def test_customer_code_and_opening_balance_stay_fixed_even_if_included_in_payload(db_session):
    client = _client(db_session)
    try:
        created = _create(client)
        response = client.patch(
            f"/api/customers/{created['id']}",
            json={
                "customer_code": "CUS9999",
                "opening_balance": "999.00",
                "contact_person": "Still Applied",
            },
        )
    finally:
        app.dependency_overrides.clear()

    body = response.json()
    assert body["customer_code"] == created["customer_code"]
    assert body["opening_balance"] == created["opening_balance"]
    assert body["contact_person"] == "Still Applied"


def test_clearing_a_required_field_is_rejected_with_no_partial_write(db_session):
    client = _client(db_session)
    try:
        created = _create(client)
        response = client.patch(
            f"/api/customers/{created['id']}",
            json={"customer_type": "", "contact_person": "Should Not Apply"},
        )
        follow_up = client.get(f"/api/customers/{created['id']}")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 400
    assert follow_up.json()["contact_person"] is None
