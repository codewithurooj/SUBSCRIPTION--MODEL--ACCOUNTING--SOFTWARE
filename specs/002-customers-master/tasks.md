# Tasks: Customers Master

> **POST-IMPLEMENTATION AMENDMENT (2026-07-14)**: All auth-related tasks below (T013–T014, T016–T020 auth portions, T022, T023–T028) were completed as written, then their code was **removed** at the client's direction (see spec.md/plan.md amendments). Checkboxes below are left as `[X]` because they accurately record what was built and verified at the time — this file is a historical execution log, not a live description of current code. See `history/prompts/002-customers-master/006-remove-authentication.*.prompt.md` for the removal record.

**Input**: Design documents from `/specs/002-customers-master/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/customers-api.openapi.yaml, quickstart.md

**Tests**: Included and REQUIRED, not optional. The project constitution marks TDD (Article II) non-negotiable ("A task in tasks.md MUST NOT be marked complete unless a test written before its implementation code is passing") and the original feature request explicitly asked for pytest + Vitest/RTL coverage with 100% on financial-adjacent logic. Every test task below MUST be written, run, and observed to FAIL before its paired implementation task begins.

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Exact file paths are included in every description

## Path Conventions (Option 2: web app, per plan.md)

- Backend: `backend/src/`, `backend/tests/`, `backend/alembic/`
- Frontend: `frontend/app/`, `frontend/lib/`, `frontend/components/`, `frontend/tests/` (existing repo, extended in place)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold the brand-new `backend/` project (first backend in this repo) and the minor frontend additions it needs.

- [X] T001 Create the backend directory skeleton: `backend/src/{core,models,schemas,api/routes,services}/`, `backend/tests/{contract,integration,unit}/`, `backend/alembic/` (empty `__init__.py` files as needed), per plan.md's Project Structure
- [X] T002 Create `backend/pyproject.toml` with dependencies: fastapi, sqlmodel, pydantic-settings, pyjwt, passlib[argon2], psycopg[binary], alembic, and dev dependencies pytest, pytest-asyncio, httpx, ruff
- [X] T003 [P] Create `backend/.env.example` documenting `DATABASE_URL`, `DATABASE_URL_TEST`, `JWT_SECRET`, `JWT_EXPIRE_MINUTES`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- [X] T004 [P] Configure ruff lint + format rules in `backend/pyproject.toml`
- [X] T005 Initialize Alembic scaffolding in `backend/alembic/` (`alembic.ini`, `env.py` wired to SQLModel's metadata and `Settings.DATABASE_URL`) (depends on T002)
- [X] T006 [P] Create `backend/tests/conftest.py`: pytest fixtures providing a real-Postgres session against `DATABASE_URL_TEST` with per-test transaction rollback for isolation (research.md #5) (depends on T002)
- [X] T007 [P] Add the `jose` package to `frontend/package.json` (JWT verification for the frontend DAL/proxy)
- [X] T008 [P] Create `frontend/.env.example` documenting `BACKEND_API_URL`, `JWT_SECRET`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, authentication framework, and BFF session plumbing that every user story depends on — none of them touch customer data without this in place.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T009 [P] Create `backend/src/core/config.py`: `pydantic-settings` `Settings` class reading every env var from T003 (depends on T002)
- [X] T010 [P] Create `backend/src/models/customer.py`: `Customer` SQLModel entity with all 19 fields and constraints per data-model.md (depends on T002)
- [X] T011 [P] Create `backend/src/models/user.py`: `User` SQLModel entity (auth-only: id, email, password_hash, role, created_at) per data-model.md (depends on T002)
- [X] T012 Generate Alembic migration `0001_initial` in `backend/alembic/versions/`: `customers` table (with a partial unique index on `tax_registration_no` where not null), `users` table, and the `customers_code_seq` sequence (research.md #3) (depends on T005, T010, T011)
- [X] T013 [P] Write `backend/tests/unit/test_security.py`: unit tests for password hash/verify round-trip and JWT encode/decode round-trip, including expired-token and invalid-signature rejection. Run it and confirm it FAILS (module doesn't exist yet). (depends on T006)
- [X] T014 Create `backend/src/core/security.py`: argon2 password hashing + JWT encode/decode helpers, to make T013 pass (depends on T013, T009)
- [X] T015 Create `backend/src/core/db.py`: SQLModel engine + `get_session` dependency (depends on T009, T012)
- [X] T016 [P] Write `backend/tests/unit/test_deps.py`: unit tests for the `get_current_user` dependency — rejects missing/malformed/expired/invalid-signature tokens, accepts a valid token and returns the user. Run it and confirm it FAILS. (depends on T006)
- [X] T017 Create `backend/src/api/deps.py`: `get_current_user` dependency (default-deny, Article V) to make T016 pass (depends on T014, T015, T016)
- [X] T018 [P] Write `backend/tests/contract/test_auth_login.py`: contract test for `POST /api/auth/login` — 200 + `TokenResponse` shape on valid credentials, 401 on invalid. Run it and confirm it FAILS. (depends on T006)
- [X] T019 Create `backend/src/schemas/auth.py`: `LoginRequest`, `TokenResponse` Pydantic schemas (depends on T018)
- [X] T020 Create `backend/src/api/routes/auth.py`: `POST /api/auth/login` endpoint, to make T018 pass (depends on T014, T015, T019)
- [X] T021 Create `backend/src/main.py`: FastAPI app factory registering the auth router (depends on T020)
- [X] T022 Create `backend/src/seed.py`: idempotent bootstrap of one admin-capable user from `ADMIN_EMAIL`/`ADMIN_PASSWORD` (depends on T014, T015)
- [X] T023 [P] Create `frontend/lib/session.ts`: `jose`-based JWT verification + typed session-cookie get/set/clear helpers (depends on T007)
- [X] T024 [P] Create `frontend/lib/dal.ts`: `verifySession()` Data Access Layer, per the Next.js 16 auth guide pattern used in research.md #2 (depends on T023)
- [X] T025 Create `frontend/proxy.ts`: optimistic redirect of unauthenticated requests away from `/(dashboard)/**` to `/login` — Next.js 16 renamed `middleware.ts` to `proxy.ts` (research.md #2) (depends on T023)
- [X] T026 Create `frontend/app/api/auth/login/route.ts`: BFF handler calling backend `POST /api/auth/login` and setting the httpOnly session cookie (depends on T023)
- [X] T027 Create `frontend/app/api/auth/logout/route.ts`: BFF handler clearing the session cookie (depends on T023)
- [X] T028 Create `frontend/app/login/page.tsx`: login form posting to the BFF login route (depends on T024, T026)

**Checkpoint**: Foundation ready — a user can log in, unauthenticated requests are redirected, the DB schema exists. User story implementation can now begin.

---

## Phase 3: User Story 1 - Create a new customer record (Priority: P1) 🎯 MVP

**Goal**: An accounting staff member can add a new customer with a server-generated, sequential `customer_code`, satisfying all required-field and financial-data validation.

**Independent Test**: From the Customers page (or via the API directly), submit a valid create payload and confirm a new record appears with a `CUS0001`-style code the caller never supplied; submit an invalid payload and confirm it's rejected with no record created.

### Tests for User Story 1 ⚠️ Write first, run, confirm FAIL

- [X] T029 [P] [US1] Write `backend/tests/unit/test_customer_service.py`: unit tests — `customer_code` generation is sequential and unique across repeated calls; `opening_balance`/`credit_limit` validation rejects negative, non-2-decimal, and non-numeric values while accepting valid decimals; `customer_type`/`balance_type`/`status` validation rejects out-of-set values (depends on T012)
- [X] T030 [P] [US1] Write `backend/tests/contract/test_customers_create.py`: contract test for `POST /api/customers` — 201 + `CustomerRead` shape on a valid payload; 400 on a missing required field (depends on T012)
- [X] T031 [P] [US1] Write `backend/tests/integration/test_create_customer.py`: integration tests — create persists with a sequential `customer_code`, defaults `status` to Active, auto-sets `created_at`/`updated_at`; rejects a duplicate `tax_registration_no`; rejects a currency outside the curated ISO list (depends on T012)
- [X] T032 [P] [US1] Write `backend/tests/integration/test_create_customer_concurrency.py`: integration test — N concurrent create requests never produce a duplicate `customer_code` (FR-007) (depends on T012)

### Implementation for User Story 1

- [X] T033 [US1] Create `backend/src/schemas/customer.py`: `CustomerCreate`, `CustomerRead` Pydantic schemas, Decimal fields serialized as strings on the wire (Article III) (depends on T030)
- [X] T034 [US1] Create `backend/src/services/customer_service.py`: `generate_customer_code()` (via `customers_code_seq`), `validate_currency()`, `create_customer()`, making T029/T031/T032 pass (depends on T029, T033)
- [X] T035 [US1] Create `backend/src/api/routes/customers.py`: `POST /api/customers` endpoint gated by `get_current_user`, making T030 pass (depends on T017, T034)
- [X] T036 [US1] Register the customers router in `backend/src/main.py` (depends on T035)
- [X] T037 [P] [US1] Write `frontend/tests/components/customers/CustomerForm.test.tsx`: component test — blocks submit and shows inline errors when a required field is missing
- [X] T038 [P] [US1] Create `frontend/components/customers/CustomerForm.tsx`: create-mode form (all fields; required-field, enum, and decimal client-side validation per FR-023; curated currency dropdown), making T037 pass (depends on T037)
- [X] T039 [US1] Create `frontend/app/api/customers/route.ts`: BFF `POST` handler forwarding to the backend with the session Bearer token (depends on T024)
- [X] T040 [US1] Replace the placeholder at `frontend/app/(dashboard)/masters/customers/page.tsx` with a page shell rendering a "New Customer" trigger + `CustomerForm` modal (depends on T038, T039)
- [X] T041 [P] [US1] Write `frontend/tests/integration/customers/create-customer.test.tsx`: integration test — submitting a valid create form adds the new customer via the BFF route

**Checkpoint**: User Story 1 is fully functional and independently testable — customers can be created via UI or API.

---

## Phase 4: User Story 2 - Search and browse the customer list (Priority: P2)

**Goal**: An accounting staff member can browse a paginated, searchable, sortable, status-filterable list of customers.

**Independent Test**: With several customers already created (US1), load the list, search a substring in the middle of a name, sort by each column, and toggle the Active-only/Inactive-only filter — confirm results match in each case, including an empty-search empty state.

### Tests for User Story 2 ⚠️ Write first, run, confirm FAIL

- [X] T042 [P] [US2] Write a unit test in `backend/tests/unit/test_customer_service.py`: the list query applies substring search across `customer_code`, `customer_name`, and `contact_person` correctly (depends on T034)
- [X] T043 [P] [US2] Write `backend/tests/contract/test_customers_list.py`: contract test for `GET /api/customers` — 200 + `CustomerListResponse` shape; supports `search`, `status`, `sort_by`, `sort_order`, `page`, `page_size` params (depends on T012)
- [X] T044 [P] [US2] Write `backend/tests/integration/test_list_customers.py`: integration tests — pagination works; default response includes both Active and Inactive; the status filter narrows correctly; substring search matches mid-string (not just prefix); an empty search returns an empty `items` array, not an error; sorting by each allowed column works ascending and descending (depends on T031)

### Implementation for User Story 2

- [X] T045 [US2] Extend `backend/src/schemas/customer.py` with `CustomerListResponse` (depends on T043)
- [X] T046 [US2] Extend `backend/src/services/customer_service.py` with `list_customers()` (search/status filter/sort/pagination), making T042/T044 pass (depends on T042, T045)
- [X] T047 [US2] Extend `backend/src/api/routes/customers.py` with the `GET /api/customers` endpoint, making T043 pass (depends on T046)
- [X] T048 [P] [US2] Write `frontend/tests/components/customers/CustomerTable.test.tsx`: component test — renders an empty state on no results; invokes search/sort/filter handlers correctly
- [X] T049 [P] [US2] Create `frontend/components/customers/CustomerTable.tsx`: sortable/searchable/filterable/paginated table, making T048 pass (depends on T048)
- [X] T050 [US2] Extend `frontend/app/api/customers/route.ts` with a BFF `GET` handler forwarding query params + the Bearer token (depends on T039)
- [X] T051 [US2] Wire `CustomerTable` into `frontend/app/(dashboard)/masters/customers/page.tsx`, fetching via the BFF (depends on T049, T050)

**Checkpoint**: User Stories 1 AND 2 both work independently — browse/search/sort/filter customers created via US1.

---

## Phase 5: User Story 3 - Edit an existing customer's details (Priority: P3)

**Goal**: An accounting staff member can update a customer's editable fields; `customer_code`, `opening_balance`, `id`, and `created_at` stay fixed no matter what the request contains.

**Independent Test**: Open an existing customer, change an editable field and an immutable one (e.g. `opening_balance`) in the same submission, save, and confirm only the editable field changed while `updated_at` refreshed.

### Tests for User Story 3 ⚠️ Write first, run, confirm FAIL

- [X] T052 [P] [US3] Write a unit test in `backend/tests/unit/test_customer_service.py`: `update_customer()` rejects/ignores changes to `id`, `customer_code`, `opening_balance`, `created_at`, applies allowed changes, and refreshes `updated_at` (depends on T034)
- [X] T053 [P] [US3] Write `backend/tests/contract/test_customers_detail.py`: contract test for `GET /api/customers/{id}` — 200 + `CustomerRead`; 404 for an unknown id (depends on T012)
- [X] T054 [P] [US3] Write `backend/tests/contract/test_customers_update.py`: contract test for `PATCH /api/customers/{id}` — 200 + updated `CustomerRead` on a valid partial payload; 400 on a validation error (depends on T012)
- [X] T055 [P] [US3] Write `backend/tests/integration/test_update_customer.py`: integration tests — allowed-field edits persist and refresh `updated_at`, while `customer_code`/`opening_balance`/`created_at` stay fixed even when included in the payload; clearing a required field is rejected with no partial write (depends on T031)
- [X] T056 [P] [US3] Write `backend/tests/integration/test_update_customer_concurrency.py`: integration test — two sequential updates to the same customer apply last-write-wins with no conflict error (FR-025) (depends on T031)

### Implementation for User Story 3

- [X] T057 [US3] Extend `backend/src/schemas/customer.py` with `CustomerUpdate` (partial; excludes `id`/`customer_code`/`opening_balance`/`created_at`) (depends on T054)
- [X] T058 [US3] Extend `backend/src/services/customer_service.py` with `get_customer()`, `update_customer()`, making T052/T055/T056 pass (depends on T052, T057)
- [X] T059 [US3] Extend `backend/src/api/routes/customers.py` with `GET /api/customers/{id}` and `PATCH /api/customers/{id}`, making T053/T054 pass (depends on T058)
- [X] T060 [P] [US3] Extend `frontend/tests/components/customers/CustomerForm.test.tsx`: edit mode renders `opening_balance`/`customer_code` as read-only and still submits other field changes
- [X] T061 [US3] Extend `frontend/components/customers/CustomerForm.tsx` with edit mode (pre-filled, `opening_balance`/`customer_code` read-only), making T060 pass (depends on T038, T060) — already built generically at T038, confirmed green
- [X] T062 [US3] Create `frontend/app/api/customers/[id]/route.ts`: BFF `GET` + `PATCH` handlers (depends on T024)
- [X] T063 [US3] Wire an "Edit" action into `frontend/app/(dashboard)/masters/customers/page.tsx` that opens `CustomerForm` in edit mode (depends on T061, T062)

**Checkpoint**: User Stories 1, 2, AND 3 all work independently — any existing customer can be edited.

---

## Phase 6: User Story 4 - Deactivate or reactivate a customer (Priority: P4)

**Goal**: An accounting staff member can toggle a customer between Active and Inactive; no hard-delete path exists anywhere.

**Independent Test**: Deactivate an Active customer, confirm it's excluded from the Active-only filtered view but still visible/viewable unfiltered, then reactivate it and confirm every other field is untouched.

### Tests for User Story 4 ⚠️ Write first, run, confirm FAIL

- [X] T064 [P] [US4] Write a unit test in `backend/tests/unit/test_customer_service.py`: `set_customer_status()` toggles Active/Inactive without altering other fields, rejects invalid status values (depends on T034)
- [X] T065 [P] [US4] Write `backend/tests/contract/test_customers_status.py`: contract test for `PATCH /api/customers/{id}/status` — 200 + updated `CustomerRead`; 400 on an invalid status value (depends on T012)
- [X] T066 [P] [US4] Write `backend/tests/integration/test_customer_status.py`: integration tests — deactivate → reactivate round-trip preserves every other field; a deactivated customer remains visible in the unfiltered list and via `GET`; no `DELETE` route exists on `/api/customers/{id}` (FR-019) (depends on T031)

### Implementation for User Story 4

- [X] T067 [US4] Extend `backend/src/schemas/customer.py` with `StatusUpdateRequest` (depends on T065)
- [X] T068 [US4] Extend `backend/src/services/customer_service.py` with `set_customer_status()`, making T064/T066 pass (depends on T064, T067)
- [X] T069 [US4] Extend `backend/src/api/routes/customers.py` with `PATCH /api/customers/{id}/status`, making T065 pass (depends on T068)
- [X] T070 [P] [US4] Write `frontend/tests/components/customers/CustomerStatusToggle.test.tsx`: component test — calls the status BFF route and updates UI state; asserts no delete action is rendered anywhere
- [X] T071 [P] [US4] Create `frontend/components/customers/CustomerStatusToggle.tsx`: Active/Inactive toggle control, making T070 pass (depends on T070)
- [X] T072 [US4] Create `frontend/app/api/customers/[id]/status/route.ts`: BFF `PATCH` handler (depends on T024)
- [X] T073 [US4] Wire the status toggle action and the Active-only/Inactive-only filter control into `CustomerTable` via `frontend/app/(dashboard)/masters/customers/page.tsx` (depends on T049, T071, T072)

**Checkpoint**: All 4 user stories are independently functional — full CRUD (minus hard delete) is complete.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Coverage gates, lint, and the manual smoke test — nothing here should change behavior, only verify and document it.

- [X] T074 [P] Run `pytest --cov=src --cov-report=term-missing` in `backend/`; confirm 100% line+branch coverage on `customer_service.py` and `security.py` and ≥80% elsewhere (constitution Testing & Quality Gates); add tests to close any gap found
- [X] T075 [P] Run `npm run test` in `frontend/`; confirm the full Vitest suite passes
- [X] T076 [P] Run `ruff check backend/` and `npm run lint` in `frontend/`; fix any findings
- [X] T077 Execute quickstart.md's 6-step manual smoke test end-to-end against a running backend + frontend and record the results
- [X] T078 Review `backend/.env.example` and `frontend/.env.example` against actual code references; ensure no variable is missing or stale

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3–6)**: All depend on Foundational completion
  - US1 (P1) has no dependency on US2–US4
  - US2 (P2) reads data US1 creates but its own code/tests/endpoint are independent — can be built in parallel by a second developer once Foundational is done, though it's easiest to validate manually after US1 exists
  - US3 (P3) extends files US1 created (`customer.py` schemas, `customer_service.py`, `customers.py` routes, `CustomerForm.tsx`) — sequentially dependent on those specific files, not on US1's behavior being "done" in a release sense
  - US4 (P4) similarly extends US1/US2's shared files
- **Polish (Phase 7)**: Depends on all four user stories being complete

### Within Each User Story

- Tests are written and MUST FAIL before implementation begins (Article II, non-negotiable)
- Schemas before services; services before routes; backend before the frontend pieces that call it
- Story complete (checkpoint) before moving to the next priority, if working sequentially

### Parallel Opportunities

- All `[P]`-marked Setup tasks (T003, T004, T006, T007, T008) can run together
- All `[P]`-marked Foundational tasks (T009–T011, T013, T016, T018, T023, T024) can run together within their dependency tier
- All test-writing tasks within a story marked `[P]` (e.g. T029–T032) can run together — they touch different files and share no implementation dependency
- Different user stories can be staffed in parallel once Foundational is complete, keeping in mind US3/US4 extend files US1/US2 create (see note above)

---

## Parallel Example: User Story 1

```bash
# Launch all US1 tests together (different files, no shared dependency):
Task: "Unit tests for customer_code generation and financial-field validation in backend/tests/unit/test_customer_service.py"
Task: "Contract test for POST /api/customers in backend/tests/contract/test_customers_create.py"
Task: "Integration tests for customer creation in backend/tests/integration/test_create_customer.py"
Task: "Integration test for concurrent customer_code generation in backend/tests/integration/test_create_customer_concurrency.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (auth + schema — CRITICAL, blocks everything)
3. Complete Phase 3: User Story 1 (Create)
4. **STOP and VALIDATE**: run T029–T032/T037/T041 green, exercise quickstart.md step 1–2 manually
5. Deploy/demo if ready — customers can already be created and viewed one at a time via `GET /api/customers/{id}` even before US2's list UI exists

### Incremental Delivery

1. Setup + Foundational → auth and schema ready
2. + US1 → create works → MVP demo
3. + US2 → browse/search/sort/filter works
4. + US3 → edit works
5. + US4 → deactivate/reactivate works, full CRUD parity reached
6. Polish → coverage gates, lint, smoke test sign-off

### Notes

- `[P]` tasks touch different files with no unmet dependency
- `[Story]` labels give traceability back to spec.md's User Story 1–4
- Commit after each task or logical group
- Every financial-field or auth-security task (customer_service.py, security.py) must reach 100% coverage per the constitution before Phase 7 is considered done
