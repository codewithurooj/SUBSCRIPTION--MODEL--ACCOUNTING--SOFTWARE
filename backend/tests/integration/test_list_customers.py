from fastapi.testclient import TestClient

from src.core.db import get_session
from src.main import app


def _client(db_session):
    app.dependency_overrides[get_session] = lambda: db_session
    return TestClient(app)


def _create(client, **overrides):
    payload = dict(
        customer_name="Acme Co",
        customer_type="Company",
        opening_balance="100.00",
        balance_type="Debit",
        currency="AED",
        status="Active",
    )
    payload.update(overrides)
    response = client.post("/api/customers", json=payload)
    assert response.status_code == 201
    return response.json()


def test_list_is_paginated(db_session):
    client = _client(db_session)
    try:
        for i in range(5):
            _create(client, customer_name=f"Customer {i}")
        response = client.get("/api/customers", params={"page": 1, "page_size": 2})
    finally:
        app.dependency_overrides.clear()

    body = response.json()
    assert len(body["items"]) == 2
    assert body["total"] >= 5
    assert body["page"] == 1
    assert body["page_size"] == 2


def test_list_shows_both_statuses_by_default_and_filter_narrows(db_session):
    from src.models.customer import Customer

    client = _client(db_session)
    try:
        active = _create(client, customer_name="Active Customer Z1")
        inactive = _create(client, customer_name="Inactive Customer Z1")
        # Set directly via the DB, not the (not-yet-built, US4) status endpoint —
        # keeps US2 independently testable without a cross-story dependency.
        db_customer = db_session.get(Customer, inactive["id"])
        db_customer.status = "Inactive"
        db_session.add(db_customer)
        db_session.commit()

        unfiltered = client.get("/api/customers", params={"search": "Z1", "page_size": 50})
        active_only = client.get(
            "/api/customers", params={"search": "Z1", "status": "Active", "page_size": 50}
        )
    finally:
        app.dependency_overrides.clear()

    unfiltered_ids = {c["id"] for c in unfiltered.json()["items"]}
    active_only_ids = {c["id"] for c in active_only.json()["items"]}

    assert active["id"] in unfiltered_ids
    assert inactive["id"] in unfiltered_ids
    assert active["id"] in active_only_ids
    assert inactive["id"] not in active_only_ids


def test_search_matches_a_substring_not_only_a_prefix(db_session):
    client = _client(db_session)
    try:
        created = _create(client, customer_name="Zebra Testing Corp")
        response = client.get("/api/customers", params={"search": "Testing"})
    finally:
        app.dependency_overrides.clear()

    ids = {c["id"] for c in response.json()["items"]}
    assert created["id"] in ids


def test_search_with_no_matches_returns_an_empty_items_array_not_an_error(db_session):
    client = _client(db_session)
    try:
        response = client.get("/api/customers", params={"search": "no-such-customer-xyz"})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["items"] == []


def test_sort_by_customer_name_ascending_and_descending(db_session):
    client = _client(db_session)
    try:
        _create(client, customer_name="Sort Alpha")
        _create(client, customer_name="Sort Zulu")

        asc = client.get(
            "/api/customers",
            params={"search": "Sort", "sort_by": "customer_name", "sort_order": "asc"},
        )
        desc = client.get(
            "/api/customers",
            params={"search": "Sort", "sort_by": "customer_name", "sort_order": "desc"},
        )
    finally:
        app.dependency_overrides.clear()

    asc_names = [c["customer_name"] for c in asc.json()["items"]]
    desc_names = [c["customer_name"] for c in desc.json()["items"]]
    assert asc_names == sorted(asc_names)
    assert desc_names == sorted(desc_names, reverse=True)
