from decimal import Decimal

from fastapi.testclient import TestClient
from sqlmodel import select

from src.core.db import get_session
from src.main import app
from src.models.customer import Customer


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


def test_created_customer_persists_with_sequential_code_and_active_default(db_session):
    client = _client(db_session)
    try:
        payload = _valid_payload()
        del payload["status"]  # omit — should default to Active (FR-010)
        response = client.post("/api/customers", json=payload)
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "Active"

    stored = db_session.exec(select(Customer).where(Customer.id == body["id"])).first()
    assert stored is not None
    assert stored.customer_code == body["customer_code"]
    assert stored.opening_balance == Decimal("100.00")
    assert stored.created_at is not None
    assert stored.updated_at is not None


def test_create_rejects_duplicate_tax_registration_no(db_session):
    client = _client(db_session)
    try:
        first = client.post(
            "/api/customers", json=_valid_payload(tax_registration_no="TRN-123")
        )
        assert first.status_code == 201

        second = client.post(
            "/api/customers",
            json=_valid_payload(customer_name="Different Co", tax_registration_no="TRN-123"),
        )
    finally:
        app.dependency_overrides.clear()

    assert second.status_code == 400


def test_create_allows_multiple_customers_with_no_tax_registration_no(db_session):
    client = _client(db_session)
    try:
        first = client.post("/api/customers", json=_valid_payload())
        second = client.post("/api/customers", json=_valid_payload(customer_name="Other Co"))
    finally:
        app.dependency_overrides.clear()

    assert first.status_code == 201
    assert second.status_code == 201


def test_create_rejects_currency_outside_the_curated_list(db_session):
    client = _client(db_session)
    try:
        response = client.post("/api/customers", json=_valid_payload(currency="ZZZ"))
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 400
