<!--
Sync Impact Report
==================
Version change: N/A (template) → 1.0.0
Rationale: Initial ratification. All template placeholders filled with concrete,
testable principles for the first time — MAJOR version per semantic versioning
policy for constitutions (initial adoption = 1.0.0).

Modified principles: N/A (first version — no prior principles to rename)

Added sections:
- Core Principles I–VI (SDD, TDD, Financial Data Integrity, Immutable Ledger,
  RBAC, Secrets Management)
- Technology Stack (Locked-In)
- Testing & Quality Gates
- Governance

Removed sections: N/A (first version)

Templates requiring updates:
- ✅ .specify/templates/plan-template.md — Constitution Check gate references
  generic "[Gates determined based on constitution file]"; compatible as-is,
  no edit required (gates are derived at plan-time from this file).
- ✅ .specify/templates/spec-template.md — no constitution-specific placeholders
  to reconcile; generic structure remains compatible.
- ✅ .specify/templates/tasks-template.md — generic task categorization remains
  compatible; TDD principle (Article II) already matches the template's
  "write tests first, ensure they fail" guidance for the Tests subsections.
- ✅ .claude/commands/sp.constitution.md — no agent-specific naming found that
  needs genericizing.
- ⚠ README.md — not present in repo root as of this amendment; no action taken.
  Create a README referencing this constitution when project scaffolding begins.

Follow-up TODOs:
- TODO(AUTH_LIBRARY): Better Auth vs. custom JWT implementation is deferred to
  the plan.md of the first feature that introduces authentication. Constitution
  fixes the requirements (RBAC, JWT-based sessions, no hardcoded secrets) but
  not the specific library — track the decision via ADR when that feature is
  planned.
-->

# Subscription Model Accounting Software Constitution

## Core Principles

### I. Spec-Driven Development (SDD) — NON-NEGOTIABLE

Every feature MUST be developed through the SDD workflow, in this order, before
any implementation code is written: `/sp.specify` → `/sp.clarify` → `/sp.plan` →
`/sp.tasks` → implementation. Each feature MUST have its own directory at
`specs/<feature-name>/` containing `spec.md`, `plan.md`, and `tasks.md`.
Implementation code MUST NOT be committed for a feature until:

1. `spec.md` exists and unresolved `[NEEDS CLARIFICATION]` markers have been
   resolved via `/sp.clarify`.
2. `plan.md` exists and its Constitution Check gate passes (or violations are
   justified in the Complexity Tracking table).
3. `tasks.md` exists and enumerates testable tasks derived from the spec.

The client reveals requirements incrementally, feature by feature. This is the
project's normal operating mode, not an exception — every newly revealed
feature MUST restart this cycle from `/sp.specify`, regardless of how small it
appears. No feature may skip spec/plan/tasks because it "seems obvious" or
"is just a small addition."

**Rationale**: Without an upfront full spec, per-feature traceability from
stated requirement → architectural decision → implementation is the only way
to keep the system coherent as scope arrives piecemeal. Skipping steps here
compounds into an undocumented, unauditable codebase — unacceptable for
software of record for financial data.

### II. Test-Driven Development (TDD) — NON-NEGOTIABLE

All implementation code MUST follow the Red-Green-Refactor cycle:

1. **Red**: Write a test that expresses the required behavior. Run it and
   confirm it fails (or fails to compile/import, for net-new modules).
2. **Green**: Write the minimum implementation code necessary to make the
   test pass. No unrelated functionality may be added in this step.
3. **Refactor**: Improve the implementation's structure without changing
   observable behavior, keeping all tests green.

A task in `tasks.md` MUST NOT be marked complete unless a test written before
its implementation code is passing. Tests written after the fact to backfill
coverage on already-written implementation code do NOT satisfy this article
and MUST be redone test-first for that behavior to count as compliant.

**Rationale**: This is accounting software; incorrect behavior has financial
consequences. Red-Green-Refactor is the enforcement mechanism that guarantees
every behavior has a failing test proving it was needed, not just a passing
test proving it happens to work today.

### III. Financial Data Integrity (Decimal-Only Money)

All monetary values, anywhere in the system — database columns, API request
and response payloads, in-memory calculations, exported reports — MUST use
fixed-point decimal/numeric types. Floating-point types (`float`, `double`,
JavaScript `number` for currency fields) MUST NOT be used to store, transmit,
or compute money.

- Backend: SQLModel fields for monetary values MUST use `Decimal` mapped to
  PostgreSQL `NUMERIC`/`DECIMAL` columns with an explicit precision and scale.
- Frontend: monetary values MUST be treated as strings or a decimal-safe type
  across network boundaries and only formatted for display at render time,
  never coerced to a JS `number` for arithmetic.
- Currency conversion, tax, and proration calculations MUST use decimal
  arithmetic libraries (e.g., Python `decimal.Decimal`), never native
  floating-point operators.

**Rationale**: Floating-point binary representation cannot exactly represent
most base-10 currency amounts, producing rounding drift that is unacceptable
in an accounting ledger and can cause books to fail to balance.

### IV. Immutable Ledger & Audit Trail

Ledger entries (any record representing a financial transaction, charge,
credit, refund, or balance adjustment) are **append-only**. Once written, a
ledger row MUST NOT be updated (`UPDATE`) or deleted (`DELETE`) by application
code. Corrections, reversals, and adjustments MUST be represented as new,
distinct ledger entries that reference the entry they correct (e.g., via a
`reverses_entry_id` or `correction_of_id` foreign key), never as an edit to
the original row.

- Database roles/permissions used by the application MUST NOT grant `UPDATE`
  or `DELETE` on ledger tables; only `INSERT` and `SELECT`.
- Any feature that appears to require "editing" a past transaction MUST be
  designed as: (a) the original entry stands, (b) a new reversing entry is
  posted, (c) a new corrected entry is posted if applicable.

**Rationale**: Append-only ledgers are the standard accounting mechanism for
producing a trustworthy audit trail — every historical state is reconstructible
and no entry can silently disappear or change after the fact.

### V. Role-Based Access Control From Day One

Every feature that exposes data or actions through an API or UI MUST enforce
role-based access control (RBAC), even in early iterations before all roles
are finalized. At minimum, the system distinguishes **admin**, **accountant**,
and **subscriber** roles; a feature MUST declare in its `spec.md` which
role(s) may perform each action before `/sp.plan` is run.

- No endpoint may be implemented without an explicit authorization check tied
  to a role (default-deny: absence of an explicit grant means access is
  denied).
- If a feature's spec does not yet specify which roles apply, that is a
  `[NEEDS CLARIFICATION]` marker to be resolved in `/sp.clarify`, not a reason
  to ship the endpoint unauthenticated or unauthorized "for now."

**Rationale**: Retrofitting access control onto financial data after features
already exist is high-risk and historically where authorization bugs hide.
Requiring role declarations up front, even with an incomplete role list,
keeps every feature auditable against who-can-do-what.

### VI. Secrets & Configuration Management

No secret, API key, database credential, or token MAY be hardcoded in source
code, committed to version control, or embedded in client-side bundles.
All secrets MUST be supplied via environment variables, loaded from `.env`
files that are excluded from version control (`.gitignore`), with
`.env.example` (no real values) committed to document required variables.

- Frontend (Next.js): only variables intended for the browser MUST use the
  `NEXT_PUBLIC_` prefix; server-only secrets MUST NOT use that prefix.
- Backend (FastAPI): configuration MUST be loaded via a settings module
  (e.g., `pydantic-settings`) reading from environment variables, not
  hardcoded defaults for anything sensitive.
- Deployment platforms (Vercel, Render) MUST hold production secrets in their
  respective environment-variable stores, not in the repository.

**Rationale**: Financial/accounting systems are a high-value target; a single
committed credential can compromise customer payment and ledger data.

## Technology Stack (Locked-In)

The following stack decisions are constitution-level and MUST NOT be changed
by an individual feature's `plan.md`. Changing them requires a constitution
amendment (see Governance).

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS.
- **Backend**: Python, FastAPI, SQLModel.
- **Database**: PostgreSQL via Neon Serverless Postgres. Required for ACID
  transaction guarantees and correct `NUMERIC`/`DECIMAL` handling of financial
  data (see Article III). No other primary datastore may be introduced for
  transactional/ledger data without a constitution amendment.
- **Auth**: JWT-based sessions with RBAC (Article V) are required. The
  specific library — Better Auth vs. a custom JWT implementation — is
  intentionally left open and MUST be decided in the `plan.md` of the first
  feature that introduces authentication, recorded via ADR
  (`TODO(AUTH_LIBRARY)`: resolve at that time).
- **Testing**:
  - Backend: `pytest`, enforced in CI.
  - Frontend: Vitest + React Testing Library, consistent with Next.js App
    Router conventions.
- **Deployment**: Vercel (frontend) and Render (backend) are the default
  targets for every feature. Kubernetes, Kafka, Dapr, or other distributed-systems
  infrastructure MUST NOT be introduced by default. If a future feature's
  scale genuinely requires such infrastructure, that MUST be proposed and
  recorded as its own ADR (`/sp.adr`) at the time the need is demonstrated —
  not adopted preemptively.

## Testing & Quality Gates

- **Coverage floor**: Ledger and other financial-transaction modules (any
  module implementing Article IV's append-only ledger writes, balance
  calculations, or monetary computations under Article III) MUST maintain
  100% pytest line and branch coverage. All other backend modules MUST
  maintain a minimum of 80% coverage. CI MUST fail the build if either
  threshold is not met.
- **Red-before-Green is inspectable**: task descriptions in `tasks.md` for
  any story that includes tests MUST instruct running the test and observing
  failure before implementation begins (per Article II).
- **Contract and integration tests**: any change to an API endpoint's request/
  response shape, or to a database schema touching monetary or ledger data,
  MUST include a contract or integration test, not unit tests alone.
- **No merge without green CI**: a feature's tasks are not "done" until its
  full test suite (unit, contract, integration as applicable) passes in CI,
  in addition to meeting the coverage floor above.

## Governance

This constitution supersedes all other project practices, informal
conventions, or prior undocumented decisions. Where a conflict exists between
this document and any other guidance (README, code comments, prior PR
discussion), this constitution governs.

- **Amendment procedure**: amendments are proposed via `/sp.constitution` with
  the specific change described, reviewed against the Sync Impact Report
  generated by that command, and require explicit acceptance from the project
  owner (the architect) before being considered ratified. An amendment is not
  in effect until this file is updated and committed.
- **Versioning policy**: this constitution uses semantic versioning:
  - **MAJOR**: backward-incompatible principle removal or redefinition (e.g.,
    dropping the append-only ledger requirement, changing the locked-in
    database).
  - **MINOR**: a new principle or section is added, or existing guidance is
    materially expanded (e.g., adding a new mandatory role).
  - **PATCH**: wording clarifications, typo fixes, non-semantic edits.
- **Compliance review**: every `/sp.plan` invocation MUST run the Constitution
  Check gate against the current version of this file before Phase 0 research
  begins, and re-check after Phase 1 design. Any violation MUST either be
  resolved or explicitly justified in that plan's Complexity Tracking table.
  Every PR/code review MUST verify the change does not violate Articles I–VI
  above; violations block merge regardless of who authored the change.
- **Non-negotiable articles**: Articles I (SDD) and II (TDD) are explicitly
  marked NON-NEGOTIABLE. They MAY only be weakened or removed via a MAJOR
  version amendment with explicit owner sign-off recorded in the amendment's
  PHR — they MUST NOT be silently bypassed for an individual feature.

**Version**: 1.0.0 | **Ratified**: 2026-07-14 | **Last Amended**: 2026-07-14
