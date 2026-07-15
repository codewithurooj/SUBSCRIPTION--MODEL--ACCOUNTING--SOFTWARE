from fastapi.testclient import TestClient

from src.core.db import get_session
from src.main import app


def _client(db_session):
    app.dependency_overrides[get_session] = lambda: db_session
    return TestClient(app)


def test_two_sequential_updates_apply_last_write_wins_with_no_conflict_error(db_session):
    """FR-025: no optimistic-locking/version check — the save that completes
    last simply persists, and neither request is ever rejected as a conflict."""
    client = _client(db_session)
    try:
        created = client.post(
            "/api/customers",
            json=dict(
                customer_name="Acme Co",
                customer_type="Company",
                opening_balance="100.00",
                balance_type="Debit",
                currency="AED",
                status="Active",
            ),
        ).json()

        first_edit = client.patch(
            f"/api/customers/{created['id']}", json={"contact_person": "First Editor"}
        )
        second_edit = client.patch(
            f"/api/customers/{created['id']}", json={"contact_person": "Second Editor"}
        )

        final = client.get(f"/api/customers/{created['id']}")
    finally:
        app.dependency_overrides.clear()

    assert first_edit.status_code == 200
    assert second_edit.status_code == 200
    assert final.json()["contact_person"] == "Second Editor"
