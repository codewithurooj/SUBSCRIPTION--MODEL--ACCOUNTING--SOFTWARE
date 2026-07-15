# Quickstart: Customers Master

## Prerequisites

- Python 3.11+, `uv` or `pip`
- Node 20+ (matches `frontend/package.json`)
- A Postgres connection string (a Neon database, or local Postgres) for `DATABASE_URL`, and a second one for `DATABASE_URL_TEST` (research.md #5 — tests run against real Postgres, not SQLite)

## Backend setup

```bash
cd backend
cp .env.example .env
# fill in DATABASE_URL, DATABASE_URL_TEST

pip install -e ".[dev]"          # or: uv sync
alembic upgrade head              # creates customers table, customers_code_seq

uvicorn src.main:app --reload --port 8000
```

## Frontend setup

```bash
cd frontend
cp .env.example .env.local
# fill in BACKEND_API_URL=http://localhost:8000

npm install
npm run dev
```

Visit `http://localhost:3000/masters/customers` directly — no login required (authentication was removed 2026-07-14 at the client's direction; see plan.md's post-implementation amendment).

## Running tests

```bash
# Backend — against DATABASE_URL_TEST, real Postgres
cd backend
pytest --cov=src --cov-report=term-missing

# Frontend
cd frontend
npm run test
```

Coverage gates (constitution Testing & Quality Gates): `customer_service.py` (customer_code generation, decimal/balance_type validation) must hit 100% line+branch coverage; everything else in `backend/src/` has an 80% floor.

## Manual smoke test (maps to spec.md acceptance scenarios)

1. **Create (User Story 1)**: Masters → Customers → "New Customer". Fill required fields only (name, type, opening balance `0.00`, balance type, currency, status defaults to Active). Submit. Confirm the new row appears with a `CUS0001`-style code you didn't type in.
2. **Validation (User Story 1, edge case)**: Repeat, omitting `customer_name`. Confirm submission is blocked with an inline error and no row is added.
3. **Search/filter/sort (User Story 2)**: Create 2–3 more customers with distinct names. Search by a substring in the middle of a name (not just the start) — confirm it matches. Toggle the Active-only filter after deactivating one (step 5) — confirm it disappears/reappears. Sort by each column.
4. **Edit (User Story 3)**: Open a customer, change `contact_person` and `credit_limit`, save. Confirm `updated_at` changes and the values persist. Attempt to change `opening_balance` in the same form — confirm it's rejected or silently ignored (FR-024).
5. **Deactivate/reactivate (User Story 4)**: Set a customer's status to Inactive. Confirm it's excluded when the Active-only filter is applied, but still visible with no filter. Reactivate it; confirm it's fully restored with all other fields unchanged. Confirm there is no delete button/action anywhere for this record.
