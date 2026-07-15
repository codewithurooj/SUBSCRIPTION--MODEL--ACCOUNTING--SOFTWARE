from fastapi.testclient import TestClient

from src.core.db import get_session
from src.main import app


def _client(db_session):
    app.dependency_overrides[get_session] = lambda: db_session
    return TestClient(app)


def test_list_customers_returns_a_customer_list_response_shape(db_session):
    client = _client(db_session)
    try:
        response = client.get("/api/customers")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert "total" in body
    assert "page" in body
    assert "page_size" in body


def test_list_customers_accepts_all_documented_query_params(db_session):
    client = _client(db_session)
    try:
        response = client.get(
            "/api/customers",
            params={
                "search": "acme",
                "status": "Active",
                "sort_by": "customer_name",
                "sort_order": "desc",
                "page": 1,
                "page_size": 10,
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
