---
id: 001
title: Customers master full CRUD spec
stage: spec
date: 2026-07-14
surface: agent
model: claude-sonnet-5
feature: 002-customers-master
branch: 002-customers-master
user: codewithurooj
command: /sp.specify
labels: ["customers", "masters", "crud", "backend-scaffold", "financial-data"]
links:
  spec: specs/002-customers-master/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/002-customers-master/spec.md
 - specs/002-customers-master/checklists/requirements.md
 - history/prompts/002-customers-master/001-customers-master-full-crud-spec.spec.prompt.md
tests:
 - none (spec stage; no code written)
---

## Prompt

for a feature called "customers-master" — full CRUD for the Customers master (Masters → Customers) in the subscription
  accounting software.

  CONTEXT
  This replaces the placeholder page at frontend/app/(dashboard)/masters/customers/page.tsx. No backend exists yet in this repo — this is the first feature
  that needs one, so scaffold backend/ (FastAPI + SQLModel + PostgreSQL/Neon) as part of this feature, consistent with the stack locked in the constitution.

  DATA MODEL (from client-provided schema, "Table Name: customers")
  | Field              | Type            | Required | Notes                                  |
  |--------------------|-----------------|----------|-----------------------------------------|
  | id                 | INTEGER PK      | yes      | auto-increment                          |
  | customer_code      | VARCHAR(20)     | yes      | auto-generated, e.g. CUS0001            |
  | customer_name      | VARCHAR(150)    | yes      | customer/company name                   |
  | contact_person     | VARCHAR(100)    | no       | main contact person                     |
  | mobile             | VARCHAR(20)     | no       |                                          |
  | phone              | VARCHAR(20)     | no       | landline                                |
  | email              | VARCHAR(150)    | no       |                                          |
  | website            | VARCHAR(150)    | no       |                                          |
  | tax_registration_no| VARCHAR(50)     | no       | VAT/TRN number                          |
  | customer_type      | VARCHAR(20)     | yes      | Individual / Company                    |
  | opening_balance    | DECIMAL(12,2)   | yes      | default 0.00                            |
  | balance_type       | VARCHAR(10)     | yes      | Debit / Credit                          |
  | credit_limit       | DECIMAL(12,2)   | no       | allowed credit                          |
  | payment_terms      | INTEGER         | no       | credit days (30, 60, etc.)              |
  | currency           | VARCHAR(10)     | yes      | AED, USD, etc.                          |
  | status             | VARCHAR(10)     | yes      | Active / Inactive                       |
  | notes              | TEXT            | no       | internal notes                          |
  | created_at         | DATETIME        | yes      | record creation date                    |
  | updated_at         | DATETIME        | yes      | last updated                            |

  REQUIREMENTS
  - Backend: FastAPI + SQLModel model for Customer matching this schema exactly. Use Decimal (not float) for opening_balance and credit_limit per the
  constitution's financial-data rule. REST endpoints: list (with pagination), get by id, create, update, soft-delete or status toggle (Active/Inactive
  rather than hard delete, since this is master accounting data referenced elsewhere).
  - customer_code is server-generated on create (e.g. sequential CUS0001, CUS0002...), not client-supplied — validate it's never editable after creation.
  - Enforce validation matching the "Required" column: customer_name, customer_type, opening_balance, balance_type, currency, status are required;
  everything else optional.
  - Frontend: data table listing customers (sortable/searchable columns: customer_code, customer_name, customer_type, balance_type, status at minimum) + a
  form modal/page to create and edit a customer with all fields above, client-side validation matching required fields.
  - This is master data referenced by other future features (Sales, Purchase, etc. will pick a customer) — keep the API contract stable since other specs
  will depend on it.

  SCOPE
  - Full-stack: backend model + API + frontend table/form, wired together against a real Postgres (Neon) instance.
  - Follow this project's SDD workflow: /sp.specify → /sp.clarify (surface ambiguities — e.g. exact customer_code generation format, whether status defaults
  to Active, decimal rounding rules) → /sp.plan → /sp.tasks → /sp.implement.
  - Follow TDD per the constitution: 100% coverage on financial fields (opening_balance, credit_limit, balance_type logic) since this is money-adjacent
  data; standard coverage floor elsewhere. Backend tests via pytest, frontend via Vitest + React Testing Library.
  - Use Better Auth/JWT-gated RBAC architecture already locked in the constitution — this page should require an authenticated session, even if the specific
  role-restriction rules aren't defined yet.

### Follow-up clarification exchange (within the same /sp.specify session)

Three [NEEDS CLARIFICATION] markers were raised in the draft spec and resolved interactively:

1. User's verbatim answer to the role-scope question: "for now its not decided for now evert one can"
2. Uniqueness rule: user selected "Unique tax_registration_no only" (when provided; customer_name duplicates allowed).
3. Currency validation: user selected "Fixed list (ISO 4217 codes)" (dropdown, not free text).

## Response snapshot

Created branch `002-customers-master` and `specs/002-customers-master/spec.md` using the spec-template structure (no backend/frontend code written — spec stage only, per Article I of the constitution). The spec defines 4 prioritized user stories (P1 create, P2 search/browse, P3 edit, P4 deactivate/reactivate), 6 edge cases (concurrent code generation, decimal validation, immutable customer_code, unauthenticated access, empty search, duplicate tax_registration_no, invalid currency), 23 functional requirements (FR-001–FR-023) covering auth, RBAC deferral, server-generated sequential customer_code, required-field validation, decimal precision/non-negativity for money fields, pagination/search/sort, edit restrictions, and the no-hard-delete rule, plus 6 measurable, tech-agnostic success criteria.

All 3 [NEEDS CLARIFICATION] markers (role scope, uniqueness, currency validation) were resolved via interactive Q&A before finalizing:
- Role scope: deferred — all authenticated roles (admin, accountant, subscriber) permitted equally for now, tracked as `TODO(CUSTOMERS_ROLE_SCOPE)` in FR-002 (same precedent as `NAV_ROLE_SCOPE` in the 001-sidebar-navigation feature), satisfying Constitution Article V's requirement that role scope be declared (even if deferred) before `/sp.plan`.
- Uniqueness: tax_registration_no must be unique when provided (FR-020); customer_name duplicates allowed.
- Currency: restricted to a fixed ISO 4217 code list, not free text (FR-021).

Generated `specs/002-customers-master/checklists/requirements.md` and validated the spec against it — all items pass, no remaining `[NEEDS CLARIFICATION]` markers. Backend/database scaffolding details (FastAPI + SQLModel + Neon) from the original request were intentionally left out of the business-focused spec.md and deferred to `plan.md`, per SDD separation of concerns.

## Outcome

- ✅ Impact: Feature branch and business-level specification for full customer master CRUD created and validated; ready for `/sp.plan`.
- 🧪 Tests: none (spec stage; no code written)
- 📁 Files: specs/002-customers-master/spec.md, specs/002-customers-master/checklists/requirements.md
- 🔁 Next prompts: `/sp.plan` to design the backend scaffold (FastAPI + SQLModel + Neon), API contracts, and frontend architecture; `/sp.clarify` may be re-run later if the client narrows RBAC role scope (TODO(CUSTOMERS_ROLE_SCOPE)).
- 🧠 Reflection: Role-scope ambiguity is a recurring pattern across features (see 001's NAV_ROLE_SCOPE) — the client is defining roles incrementally, so the same "defer with TODO marker" resolution was reused for consistency.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): spec quality checklist — PASS (all items)
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): n/a
