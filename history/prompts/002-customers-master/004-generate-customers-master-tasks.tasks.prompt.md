---
id: 004
title: Generate customers master tasks
stage: tasks
date: 2026-07-14
surface: agent
model: claude-sonnet-5
feature: 002-customers-master
branch: 002-customers-master
user: codewithurooj
command: /sp.tasks
labels: ["customers", "masters", "crud", "tasks", "tdd"]
links:
  spec: specs/002-customers-master/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/002-customers-master/tasks.md
 - history/prompts/002-customers-master/004-generate-customers-master-tasks.tasks.prompt.md
tests:
 - none (tasks stage; no code written, tests are enumerated as future tasks)
---

## Prompt

/sp.tasks

(No additional user-supplied arguments; command run against the current feature branch `002-customers-master` with a complete plan.md, research.md, data-model.md, contracts/customers-api.openapi.yaml, and quickstart.md already in place.)

## Response snapshot

Ran `.specify/scripts/powershell/check-prerequisites.ps1 -Json` to confirm `FEATURE_DIR` and `AVAILABLE_DOCS` (research.md, data-model.md, contracts/, quickstart.md all present), then read `.specify/templates/tasks-template.md` for the required checklist format and phase structure.

Determined that although the template describes tests as "OPTIONAL," this project's constitution marks TDD (Article II) non-negotiable and the original `/sp.specify` request explicitly asked for pytest + Vitest/RTL with 100% coverage on financial fields — so tests were treated as required, not optional, with every test task instructed to be written and observed failing before its paired implementation task.

Generated `tasks.md` with 78 tasks across 7 phases:
- **Phase 1 (Setup, T001–T008)**: backend project scaffold (pyproject.toml, ruff, Alembic init, pytest conftest with real-Postgres fixtures), plus minor frontend additions (`jose` dependency, `.env.example`).
- **Phase 2 (Foundational, T009–T028)**: Customer + User SQLModel entities, the initial Alembic migration (customers/users tables + `customers_code_seq`), password hashing + JWT helpers, the `get_current_user` default-deny dependency, the login endpoint, the admin-user seed script, and the frontend session/DAL/proxy.ts/login-page plumbing — all TDD-paired (unit tests for security.py and deps.py written first).
- **Phase 3 (US1 Create, T029–T041)**: customer_code generation + financial-field validation service, POST endpoint, CustomerForm (create mode), page shell replacing the placeholder — 4 test tasks (unit, contract, integration, concurrency) precede implementation.
- **Phase 4 (US2 Search/browse, T042–T051)**: list/search/sort/filter service and endpoint, CustomerTable component — 3 test tasks precede implementation.
- **Phase 5 (US3 Edit, T052–T063)**: update service enforcing immutability of id/customer_code/opening_balance/created_at, PATCH endpoint, CustomerForm edit mode — 5 test tasks including a last-write-wins concurrency test precede implementation.
- **Phase 6 (US4 Deactivate/reactivate, T064–T073)**: status-toggle service and endpoint, CustomerStatusToggle component, no-DELETE-route assertion test — 3 test tasks precede implementation.
- **Phase 7 (Polish, T074–T078)**: coverage-gate verification (100% on customer_service.py/security.py, 80% floor elsewhere), lint, and the quickstart.md manual smoke test.

Every task follows the required `- [ ] T0XX [P?] [Story?] Description with exact file path` format; verified no Setup/Foundational/Polish task carries a `[Story]` label and every Phase 3–6 task does. Documented per-story dependency notes explaining that while US1 has zero dependency on US2–US4, US3 and US4 extend files US1/US2 create (`customer_service.py`, `customers.py` routes, `CustomerForm.tsx`, `CustomerTable.tsx`) and are therefore file-sequential even though behaviorally independent.

## Outcome

- ✅ Impact: Complete, immediately executable task breakdown for the Customers Master feature — ready for `/sp.implement`.
- 🧪 Tests: none written yet (tasks stage) — 25 test-writing tasks are enumerated across the plan, each explicitly ordered before its implementation task per Article II
- 📁 Files: specs/002-customers-master/tasks.md
- 🔁 Next prompts: `/sp.implement` to begin executing Phase 1; optionally `/sp.adr "Authentication and Session Architecture"` first (still pending from the `/sp.plan` step) if the user wants that decision documented before code lands.
- 🧠 Reflection: Treating the template's "tests are optional" language as overridden by the constitution's non-negotiable Article II (rather than defaulting to the template's stated default) was the key judgment call this stage required — worth stating explicitly in the generated file's header so future readers don't mistake the test tasks for optional scope.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): checklist-format validation (every task has checkbox + ID + correct [P]/[Story] placement + file path) — PASS on manual re-read of all 78 tasks
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): n/a
