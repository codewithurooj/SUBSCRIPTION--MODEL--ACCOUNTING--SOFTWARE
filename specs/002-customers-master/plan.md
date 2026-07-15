# Implementation Plan: Customers Master

**Branch**: `002-customers-master` | **Date**: 2026-07-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-customers-master/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

> **POST-IMPLEMENTATION AMENDMENT (2026-07-14)**: The authentication architecture described below (custom JWT, login/seed infrastructure, `users` table, BFF Bearer-token forwarding) was implemented and then **removed** at the client's direction — they are directing feature work incrementally and had not asked for authentication yet. The sections below are left largely as originally written for historical/decision-record purposes (the auth-library research in particular remains valid *if and when* auth is reintroduced), but no longer describe the current implementation. See spec.md's Clarifications (post-implementation amendment) and `history/prompts/002-customers-master/006-remove-authentication.*.prompt.md` for the removal record. Current reality: no authentication exists anywhere in this feature; `backend/src/{core/security.py,api/deps.py,api/routes/auth.py,schemas/auth.py,models/user.py,seed.py}` and `frontend/{proxy.ts,lib/session.ts,lib/dal.ts,app/login/,app/api/auth/}` were deleted.

## Summary

Full CRUD for the Customers master (create, search/browse, edit, deactivate/reactivate — never hard-delete), replacing the placeholder page at `frontend/app/(dashboard)/masters/customers/page.tsx`. This is the first feature in the repository that needs a backend, so it scaffolds `backend/` (FastAPI + SQLModel + PostgreSQL/Neon) from scratch. ~~Because the constitution defers the Better Auth vs. custom-JWT decision to "the plan.md of the first feature that introduces authentication" (`TODO(AUTH_LIBRARY)`), it also scaffolds the minimal authentication mechanism (login + JWT issuance/verification) needed to satisfy FR-001/FR-002's default-deny requirement. User management (registration, role administration) is explicitly out of scope; a single seeded admin-capable user is enough to exercise this feature and any that follow, until a dedicated User Management feature is specified.~~ **Superseded — see amendment note above: auth was built, then removed at the client's request. `TODO(AUTH_LIBRARY)` remains unresolved and moves to whichever future feature the client actually requests authentication on.**

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript 5.x / Node 20+ (frontend, matching existing `frontend/package.json`)
**Primary Dependencies**:
- Backend: FastAPI, SQLModel, Pydantic v2, `pydantic-settings` (config), `PyJWT` (JWT issue/verify), `passlib[argon2]` (password hashing), `psycopg[binary]` (Postgres driver), Alembic (migrations)
- Frontend: Next.js 16.2.10 (App Router, already in repo), React 19, Tailwind CSS v4, `jose` (Edge-compatible JWT verification for the DAL/proxy optimistic check)
**Storage**: PostgreSQL via Neon Serverless Postgres (single database; `customers` and `users` tables live in the same schema, per Article III/VI of the constitution — no secondary datastore)
**Testing**: `pytest` + `pytest-asyncio` + `httpx.ASGITransport` (backend, against a real Postgres test database — not SQLite, to preserve `NUMERIC`/sequence fidelity); Vitest + React Testing Library (frontend, matching existing `frontend/tests/` conventions)
**Target Platform**: Web — backend deployed to Render, frontend deployed to Vercel (constitution-locked defaults)
**Project Type**: web (frontend + backend, Option 2 structure)
**Performance Goals**: No unusual throughput targets; SC-003 requires locating a customer among ~5,000 records via search in under 10 seconds — trivially satisfiable with an indexed `ILIKE`/trigram query at this scale, no specialized search infra needed
**Constraints**: Decimal-only money handling (Article III — `opening_balance`/`credit_limit` as `Decimal`/`NUMERIC(12,2)`, never `float`); no hard delete anywhere (FR-019); JWT-gated, default-deny on every endpoint (Article V); secrets via env vars only (Article VI)
**Scale/Scope**: ~5,000 customer records design target (per spec Assumptions/SC-003); single internal back-office tool, not multi-tenant; 3 roles exist in principle (admin, accountant, subscriber) but all are granted equal access for now per `TODO(CUSTOMERS_ROLE_SCOPE)`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Requirement | This feature's compliance |
|---|---|---|
| I. SDD | spec → clarify → plan → tasks → implement, in order, with `specs/002-customers-master/{spec,plan,tasks}.md` | ✅ spec.md and this plan.md exist; tasks.md comes next via `/sp.tasks`; no implementation code written yet |
| II. TDD | Red-Green-Refactor; tests written and failing before implementation | ✅ Enforced at `/sp.tasks`/`/sp.implement` time — every task pairs implementation with a preceding failing test; this plan's Project Structure reserves `tests/` directories up front |
| III. Financial Data Integrity | No `float` for money, anywhere | ✅ `opening_balance`/`credit_limit` are SQLModel `Decimal` fields mapped to `NUMERIC(12,2)`; Pydantic schemas type them `Decimal`; frontend forms treat them as strings and only parse for display, never for arithmetic (no client-side balance math exists in this feature) |
| IV. Immutable Ledger | Ledger entries are append-only | ✅ N/A — `customers` is master data, not a ledger table; no ledger entries are written by this feature. FR-019's "no hard delete" is a spec-level master-data rule, not an Article IV ledger obligation, and doesn't conflict with it |
| V. RBAC From Day One | Every endpoint has an explicit, default-deny authorization check | ⚠️ **DEVIATION (client-directed, 2026-07-14)**: originally satisfied via JWT auth (see amendment note above); auth was subsequently removed at the client's explicit instruction, who is directing feature work incrementally and had not requested authentication. This is a knowing, recorded deviation from Article V, not an oversight — flagging for the constitution owner to formally amend Article V (it is not in the NON-NEGOTIABLE list) or accept as a logged exception until auth is reintroduced as its own feature. |
| VI. Secrets Management | No hardcoded secrets; env vars + `.env.example` | ✅ `JWT_SECRET`, `DATABASE_URL`, `ADMIN_EMAIL`/`ADMIN_PASSWORD` (seed-only) all sourced from env vars via `pydantic-settings` (backend) and Next.js env conventions (frontend); `.env.example` committed for both apps |
| Tech Stack (locked) | Next.js/TS/Tailwind frontend, FastAPI/SQLModel backend, Neon Postgres, JWT+RBAC auth (library open), pytest + Vitest/RTL testing, Vercel+Render deploy | ✅ All followed. Auth library choice (**custom JWT**, not Better Auth) is resolved in this plan's Research phase and flagged for ADR below, per the constitution's explicit `TODO(AUTH_LIBRARY)` instruction |

**Gate result**: PASS at original write time. **Superseded 2026-07-14**: Article V is now knowingly violated per the amendment note above — see Complexity Tracking below.

## Project Structure

### Documentation (this feature)

```text
specs/002-customers-master/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md         # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
│   └── customers-api.openapi.yaml
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

**As actually implemented (2026-07-14, post auth-removal)**:

```text
# Option 2: Web application (frontend + backend detected)

backend/
├── src/
│   ├── main.py                      # FastAPI app factory, router registration
│   ├── core/
│   │   ├── config.py                # pydantic-settings: DATABASE_URL, DATABASE_URL_TEST
│   │   └── db.py                    # SQLModel engine + session dependency
│   ├── models/
│   │   └── customer.py              # Customer SQLModel (table=True)
│   ├── schemas/
│   │   └── customer.py              # CustomerCreate, CustomerUpdate, CustomerRead, CustomerListResponse
│   ├── api/
│   │   └── routes/
│   │       └── customers.py         # /api/customers endpoints — no auth dependency
│   └── services/
│       └── customer_service.py      # customer_code sequence generation, uniqueness/immutability enforcement
├── alembic/
│   ├── env.py
│   └── versions/                    # customers table, customer_code sequence (no users table)
├── tests/
│   ├── contract/                    # OpenAPI-contract-shape tests per endpoint
│   ├── integration/                 # full request→DB→response flows (real test Postgres)
│   └── unit/                        # customer_service (100% coverage)
├── pyproject.toml
└── .env.example

frontend/
├── app/
│   ├── (dashboard)/masters/customers/
│   │   └── page.tsx                 # replaces the placeholder; customer list + create/edit modal
│   └── api/customers/
│       ├── route.ts                 # BFF: list (GET) + create (POST) — plain passthrough, no auth
│       └── [id]/
│           ├── route.ts             # BFF: get (GET) + edit (PATCH)
│           └── status/route.ts      # BFF: deactivate/reactivate (PATCH)
├── components/customers/
│   ├── CustomerTable.tsx            # sortable/searchable/filterable/paginated list
│   ├── CustomerForm.tsx             # shared create/edit form (modal), client-side validation
│   └── CustomerStatusToggle.tsx     # Active/Inactive action
└── tests/
    ├── components/customers/
    ├── integration/customers/
    └── unit/customers/
```

Removed entirely (originally built, then deleted per the client's auth-removal instruction): `backend/src/{core/security.py,api/deps.py,api/routes/auth.py,schemas/auth.py,models/user.py,seed.py}`, `frontend/{proxy.ts,lib/session.ts,lib/dal.ts,app/login/,app/api/auth/}`.

**Structure Decision**: Option 2 (web application) — `backend/` and `frontend/` are peer top-level directories, matching the constitution's locked stack (Next.js frontend, FastAPI backend) and this repo's existing `frontend/` layout. Browser-facing data access goes through Next.js Route Handlers under `frontend/app/api/**` (a plain passthrough BFF layer) rather than the browser calling FastAPI directly, avoiding cross-origin CORS complexity between Vercel and Render — this BFF shape was kept even after auth removal since it's still the right pattern for a split frontend/backend deployment, just without a token to forward now.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Article V (RBAC From Day One) not satisfied — no authentication anywhere in this feature | Client is directing feature work incrementally (table by table) and explicitly instructed authentication be removed until they ask for it | N/A — this isn't a technical tradeoff, it's a direct client instruction overriding the constitution's default for this feature. The constitution owner should either formally amend Article V (via `/sp.constitution`, since it's not in the NON-NEGOTIABLE list) or treat this as a standing logged exception until a client-requested auth feature reintroduces it |

## Post-Phase 1 Constitution Re-Check

Re-evaluated after `data-model.md` and `contracts/customers-api.openapi.yaml` were written:

- **Article III (Decimal-only money)**: Confirmed in the contract — `opening_balance`/`credit_limit` are wire-typed as `string` (decimal-format), never `number`, in both request and response schemas. ✅
- **Article IV (Immutable Ledger)**: Still N/A — no ledger table introduced. ✅
- **Article V (RBAC)**: Originally confirmed at Phase-1 write time; **now violated by client instruction** — see the amendment note at the top of this file and the Complexity Tracking entry below.
- **FR-019 (no hard delete)**: Confirmed — the contract defines no `DELETE` method anywhere; deactivation is a `PATCH .../status` call only. ✅
- No new violations introduced during design. Gate remains **PASS**.

## Agent Context

Ran `.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude` per Phase 1 step 3. This repository's root `CLAUDE.md` predates the SpecKit template (it's a custom SDD-process/rules file, not the generated `agent-file-template.md` shape) and has no `## Active Technologies` / `## Recent Changes` markers for the script to inject into, so it ran successfully but made no textual change. The authoritative technology-stack record for this feature is this `plan.md` and `research.md`, not `CLAUDE.md`.

## Architectural Decision Suggestion

**Withdrawn (2026-07-14)**: the auth-architecture ADR suggestion below no longer applies to *this* feature since auth was removed. It's left here as a pointer for whichever future feature reintroduces authentication — the research in research.md items 1–2 (custom JWT vs. Better Auth, BFF session transport) is still valid analysis to reuse at that time, it just isn't wired into shipped code right now.

~~📋 Architectural decision detected: authentication & session architecture (custom FastAPI-issued JWT vs. Better Auth; stateless session transported via an httpOnly cookie through a Next.js BFF layer, per research.md items 1–2) — this is the decision the constitution's `TODO(AUTH_LIBRARY)` explicitly deferred to "the plan.md of the first feature that introduces authentication," and every future feature requiring auth will build on it.
Document reasoning and tradeoffs? Run `/sp.adr Authentication and Session Architecture`~~
