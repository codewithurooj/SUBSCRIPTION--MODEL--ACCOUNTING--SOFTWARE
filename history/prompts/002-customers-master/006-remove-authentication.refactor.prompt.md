---
id: 006
title: Remove authentication from customers master
stage: refactor
date: 2026-07-14
surface: agent
model: claude-sonnet-5
feature: 002-customers-master
branch: 002-customers-master
user: codewithurooj
command: none
labels: ["customers", "auth-removal", "scope-reduction", "client-directed"]
links:
  spec: specs/002-customers-master/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - backend/src/ (deleted: core/security.py, api/deps.py, api/routes/auth.py, schemas/auth.py, models/user.py, seed.py)
 - backend/tests/ (deleted: unit/test_security.py, unit/test_deps.py, unit/test_seed.py, contract/test_auth_login.py, integration/test_auth_gate.py; added integration/test_health.py; edited 9 test files to drop get_current_user overrides)
 - backend/src/main.py, api/routes/customers.py, core/config.py (edited: drop auth wiring)
 - backend/alembic/env.py, alembic/versions/b14c4c9b8ed6_initial_customers_customers_code_seq.py (edited: drop users table; file renamed)
 - backend/pyproject.toml, .env.example, .env (edited: drop pyjwt/passlib deps and JWT/ADMIN env vars)
 - frontend/ (deleted: app/login/, app/api/auth/, proxy.ts, lib/session.ts, lib/dal.ts)
 - frontend/app/api/customers/{route.ts,[id]/route.ts,[id]/status/route.ts} (edited: drop token check + Bearer forwarding)
 - frontend/package.json, .env.example, .env.local (edited: drop jose dependency and JWT_SECRET)
 - specs/002-customers-master/{spec.md,plan.md,data-model.md,research.md,quickstart.md,contracts/customers-api.openapi.yaml,tasks.md} (edited: sync docs with removal)
tests:
 - backend: 53 tests (was 70), 100% coverage maintained on all modules including customer_service.py
 - frontend: 47 tests (unchanged — none were auth-dependent), lint + typecheck clean
 - manual: verified live in browser — /masters/customers loads directly with no login redirect; GET /api/customers returns 200 with no Authorization header
---

## Prompt

why we have built authentication i never asked to build it

[Followed by, after being asked how to proceed and initially answering "Keep it as built":]

for now i am building just tables client has asked me to build step by step when he ask

[Followed by, after being shown where the auth code lives while servers were running for inspection:]

remove authentication from the project we will have authentication only when client will ask me about that

## Response snapshot

The user pushed back on the authentication system built during `/sp.implement`, correctly noting they never explicitly asked for it in this conversation. Traced the actual origin for them: the original `/sp.specify` prompt did contain an explicit line requesting "Better Auth/JWT-gated RBAC architecture... this page should require an authenticated session," and the project constitution's Article V (RBAC From Day One) independently mandates auth on every feature, pre-committing the library decision to "the plan.md of the first feature that introduces authentication" — which this was, since no backend existed yet. Acknowledged that flagging this in planning docs (spec.md FR-001, plan.md's Constitution Check, an ADR suggestion) wasn't the same as pausing for explicit sign-off before implementing ~20 tasks of infrastructure, and that this should have been a checkpoint, not just a documented decision. First asked whether to keep/simplify/remove it; user chose "keep it as built." User then clarified their actual workflow — building incrementally, only what the client explicitly requests, table by table — which reframed the situation: even documented, constitution-justified scope should not have been built ahead of an explicit ask. After being shown where the auth code lived (with dev servers running for inspection), the user gave a direct, explicit instruction to remove it entirely until the client asks for it.

Executed the removal in both backend and frontend, then verified every layer:

**Backend**: deleted `core/security.py`, `api/deps.py`, `api/routes/auth.py`, `schemas/auth.py`, `models/user.py`, `seed.py` and their dedicated test files. Removed the `get_current_user` dependency wiring from `main.py` and `routes/customers.py`, and the JWT/admin fields from `config.py`. Edited the (never-deployed-anywhere-else) initial Alembic migration in place to drop `users` table creation/downgrade rather than layering a new migration, and renamed the migration file since its name referenced "users." Reset both the dev and test Postgres databases (`alembic downgrade base` → `upgrade head`, plus a manual `DROP TABLE users` since the edited downgrade function no longer had the drop statement to catch the already-applied old schema). Bulk-fixed the 9 remaining test files that overrode `get_current_user` via a `perl -0777` multi-line pattern replace (all shared an identical `_authed_client` helper), renaming to a plain `_client(db_session)` that only overrides `get_session`. Uninstalled `pyjwt`/`passlib`/`argon2-cffi` from the venv. Re-ran the full suite: 53 tests (down from 70, the auth-specific tests removed), still 100% coverage across every module including `customer_service.py`, ruff clean.

**Frontend**: deleted `app/login/`, `app/api/auth/`, `proxy.ts`, `lib/session.ts`, `lib/dal.ts`. Rewrote the three customer BFF route handlers (`route.ts`, `[id]/route.ts`, `[id]/status/route.ts`) to drop the session-token check and `Authorization: Bearer` header forwarding, becoming plain passthroughs to the backend. Uninstalled the now-unused `jose` package. Cleared the stale `.next` build cache (was still referencing the deleted route files in generated type-validator output). Full suite still 47/47 passing (none were auth-dependent to begin with), lint and typecheck clean.

**Verification**: started both servers for real, confirmed `GET /api/customers` returns 200 with no Authorization header, and confirmed in an actual browser that navigating directly to `/masters/customers` loads immediately with no redirect to a (now-nonexistent) login page.

**Docs sync**: per this project's constitution (Article I, SDD traceability — spec/plan must stay in sync with implementation), updated `spec.md` (FR-001 rewritten to explicitly state no auth is required, FR-002 marked removed, SC-005 dropped, a new Clarifications entry and an Assumptions bullet recording the reversal and its reason), `plan.md` (a prominent post-implementation amendment note, the Constitution Check's Article V row marked as a knowing deviation, a new Complexity Tracking entry justifying it as a direct client instruction rather than a technical tradeoff, the Project Structure tree updated to show what's actually deployed vs. what was deleted, the ADR suggestion marked withdrawn), `data-model.md` (User entity section replaced with a removal note), `research.md` (items #1–2 flagged as reference-only, not current), `quickstart.md` (auth setup/login steps removed from both the setup instructions and the smoke test), the OpenAPI contract (security scheme and `/auth/login` path removed entirely), and `tasks.md` (a header note explaining the auth-task checkboxes are a historical record, not current-state description — left as `[X]` since they accurately reflect what was built and tested at the time).

Did not touch the constitution itself (Article V remains written as mandatory) — flagged to the user that this is a live, unresolved tension between the constitution and the client's actual instruction, and that the constitution owner should either formally amend Article V via `/sp.constitution` or treat this as a standing logged exception.

## Outcome

- ✅ Impact: Customers Master feature now has zero authentication anywhere (backend or frontend), matching the client's incremental, ask-first workflow. Full CRUD functionality unaffected and re-verified.
- 🧪 Tests: 53 backend (100% coverage, down from 70 — auth tests removed), 47 frontend (unchanged), ruff + eslint clean, manual browser verification of no-auth access
- 📁 Files: ~20 backend files deleted/edited, ~10 frontend files deleted/edited, 7 spec artifacts updated for doc/code sync
- 🔁 Next prompts: none pending from this session. If/when the client requests authentication, research.md items #1–2 (custom JWT vs. Better Auth analysis) and the deleted code (recoverable from git history on this branch) are a ready starting point rather than a from-scratch redo.
- 🧠 Reflection: the real lesson wasn't "don't build auth" — it was that documenting a scope decision in planning artifacts (spec/plan/ADR flag) is not a substitute for an explicit checkpoint before committing significant implementation effort to it, especially when the client's actual working style (incremental, ask-first) wasn't yet known to override the constitution's general default.

## Evaluation notes (flywheel)

- Failure modes observed: none during the removal itself (clean deletion, tests confirmed via RED-equivalent-then-fix loop of running the suite after each batch of changes); the original failure mode (building unrequested scope) is the subject of this entry, not a new one.
- Graders run and results (PASS/FAIL): backend coverage gate — PASS (100% maintained); ruff — PASS; eslint — PASS; full test suites — PASS (53/53, 47/47); manual live-server verification — PASS (no auth barrier, confirmed in browser and via curl).
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): before implementing any single-line "should require auth" style clause from a spec, surface it as an explicit confirmation question rather than proceeding straight through plan → tasks → implement — this session's memory update should capture that as a standing rule for this user.
