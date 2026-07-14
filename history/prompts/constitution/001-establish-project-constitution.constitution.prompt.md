---
id: 001
title: Establish project constitution
stage: constitution
date: 2026-07-14
surface: agent
model: claude-sonnet-5
feature: none
branch: master
user: codewithurooj
command: /sp.constitution
labels: ["constitution", "sdd", "tdd", "governance"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - .specify/memory/constitution.md
 - history/prompts/constitution/001-establish-project-constitution.constitution.prompt.md
tests:
 - N/A (governance document, no executable tests)
---

## Prompt

/sp.constitution to create the project constitution for this subscription model accounting software. Use the following inputs:

  PROJECT CONTEXT
  - Client is revealing requirements incrementally, feature by feature, not as a full upfront spec.
  - Development must follow Spec-Driven Development (SDD): every feature gets its own spec.md → plan.md → tasks.md under specs/<feature-name>/, created via
  /sp.specify, /sp.clarify, /sp.plan, /sp.tasks before implementation starts.
  - Development must follow Test-Driven Development (TDD): tests are written first (red), implementation follows to pass them (green), then refactor. No
  feature is marked done without passing tests written before the implementation code.
  - These two rules (SDD workflow + TDD red-green-refactor) are non-negotiable project principles and must appear as explicit, testable articles in the
  constitution — not just guidance text.

  TECH STACK (lock these in as constitution-level decisions)
  - Frontend: Next.js (App Router), TypeScript, Tailwind CSS
  - Backend: Python, FastAPI, SQLModel
  - Database: PostgreSQL (Neon Serverless Postgres) — required for ACID transactions and correct decimal/numeric handling of financial data (no floats for
  money)
  - Auth: Better Auth or JWT
  - Testing: pytest for backend, with a required minimum coverage threshold; frontend testing tool to be chosen consistent with Next.js conventions
  - Deployment: Vercel (frontend), Render (backend) as the default; do not introduce Kubernetes/Kafka/Dapr unless a future feature's scale explicitly
  requires it — record that as a future ADR decision, not a default

  DOMAIN PRINCIPLES (accounting/subscription-specific, apply regardless of which feature is built)
  - All monetary values use decimal/numeric types, never floating point.
  - Ledger entries are append-only/immutable; corrections are new entries, not edits, for audit trail integrity.
  - Role-based access control is required from the start (e.g., admin vs. accountant vs. subscriber), even before all roles are fully defined.
  - No secrets, API keys, or credentials hardcoded — .env only.

  Fill in the constitution template with these as concrete, testable principles (not vague statements). After creating it, confirm the file path and
  summarize what was written.

## Response snapshot

Read the existing constitution template (`.specify/memory/constitution.md`) and all dependent templates
(plan/spec/tasks) to check for propagation needs. Asked three targeted clarifying questions on decisions
the brief left open: backend pytest coverage threshold, frontend testing tool, and whether to commit to
Better Auth vs JWT now. User chose: 100% coverage on ledger/financial modules (80% elsewhere), Vitest +
React Testing Library, and deferred the Better Auth vs JWT decision to the first auth feature's plan.md
(tracked as TODO(AUTH_LIBRARY)).

Wrote `.specify/memory/constitution.md` v1.0.0 with six Core Principles: I. Spec-Driven Development
(NON-NEGOTIABLE), II. Test-Driven Development / Red-Green-Refactor (NON-NEGOTIABLE), III. Financial Data
Integrity (decimal-only money, no floats), IV. Immutable Ledger & Audit Trail (append-only, corrections as
new entries), V. Role-Based Access Control From Day One (admin/accountant/subscriber default-deny), VI.
Secrets & Configuration Management (.env only, no hardcoded credentials). Added a "Technology Stack
(Locked-In)" section capturing the frontend/backend/database/auth/testing/deployment decisions, and a
"Testing & Quality Gates" section with the coverage floor and CI gate rules. Governance section defines
amendment procedure, semantic versioning policy, compliance review via `/sp.plan`'s Constitution Check
gate, and marks Articles I–II as requiring a MAJOR version amendment with explicit owner sign-off to
weaken. Prepended a Sync Impact Report as an HTML comment documenting the version bump (template → 1.0.0)
and confirming plan/spec/tasks templates and the `sp.constitution` command file remain compatible with no
edits required.

## Outcome

- ✅ Impact: `.specify/memory/constitution.md` fully populated at v1.0.0, ratified and last amended 2026-07-14; no bracketed placeholders remain (one intentional `TODO(AUTH_LIBRARY)` deferred by design, documented in the Sync Impact Report and Technology Stack section).
- 🧪 Tests: N/A — governance document; no executable tests apply.
- 📁 Files: `.specify/memory/constitution.md` (rewritten), this PHR.
- 🔁 Next prompts: first feature spec via `/sp.specify`; when an auth feature is planned, resolve `TODO(AUTH_LIBRARY)` via ADR.
- 🧠 Reflection: coverage floor, frontend testing tool, and auth library were left ambiguous in the brief — resolving them via AskUserQuestion before writing avoided baking assumptions into a document meant to be authoritative.

## Evaluation notes (flywheel)

- Failure modes observed: none — no bash `create-phr.sh` script exists in this repo (PowerShell-only scripts present), so PHR was created via the agent-native fallback path as instructed.
- Graders run and results (PASS/FAIL): N/A — manual validation performed (no unresolved bracket tokens, version/date consistency, route matches stage).
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
