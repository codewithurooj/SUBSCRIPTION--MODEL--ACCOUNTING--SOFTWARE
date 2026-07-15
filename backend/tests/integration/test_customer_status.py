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


def test_deactivate_then_reactivate_round_trip_preserves_all_other_fields(db_session):
    client = _client(db_session)
    try:
        created = _create(client)

        deactivated = client.patch(
            f"/api/customers/{created['id']}/status", json={"status": "Inactive"}
        ).json()
        reactivated = client.patch(
            f"/api/customers/{created['id']}/status", json={"status": "Active"}
        ).json()
    finally:
        app.dependency_overrides.clear()

    assert deactivated["status"] == "Inactive"
    assert reactivated["status"] == "Active"
    for field in ("customer_code", "customer_name", "opening_balance", "balance_type", "currency"):
        assert reactivated[field] == created[field]


def test_deactivated_customer_stays_visible_unfiltered_and_via_get(db_session):
    client = _client(db_session)
    try:
        created = _create(client)
        client.patch(f"/api/customers/{created['id']}/status", json={"status": "Inactive"})

        via_get = client.get(f"/api/customers/{created['id']}")
        via_list = client.get("/api/customers", params={"search": created["customer_code"]})
    finally:
        app.dependency_overrides.clear()

    assert via_get.status_code == 200
    assert via_get.json()["status"] == "Inactive"
    assert any(c["id"] == created["id"] for c in via_list.json()["items"])


def test_no_delete_route_exists_on_customer_detail(db_session):
    client = _client(db_session)
    try:
        created = _create(client)
        response = client.delete(f"/api/customers/{created['id']}")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code in (404, 405)
