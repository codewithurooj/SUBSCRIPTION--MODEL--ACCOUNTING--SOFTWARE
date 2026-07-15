---
id: 003
title: Plan customers master backend scaffold
stage: plan
date: 2026-07-14
surface: agent
model: claude-sonnet-5
feature: 002-customers-master
branch: 002-customers-master
user: codewithurooj
command: /sp.plan
labels: ["customers", "masters", "crud", "backend-scaffold", "auth", "fastapi", "nextjs"]
links:
  spec: specs/002-customers-master/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/002-customers-master/plan.md
 - specs/002-customers-master/research.md
 - specs/002-customers-master/data-model.md
 - specs/002-customers-master/contracts/customers-api.openapi.yaml
 - specs/002-customers-master/quickstart.md
 - history/prompts/002-customers-master/003-plan-customers-master-backend-scaffold.plan.prompt.md
tests:
 - none (plan stage; no code written)
---

## Prompt

/sp.plan

(No additional user-supplied arguments; command run against the current feature branch `002-customers-master` and its finalized spec at `specs/002-customers-master/spec.md`, which had already been through one `/sp.clarify` round.)

## Response snapshot

Ran `.specify/scripts/powershell/setup-plan.ps1 -Json` to copy the plan template and resolve paths, then read `spec.md` and `.specify/memory/constitution.md` in full. Surveyed the existing repo (`frontend/` structure, `package.json`, no `backend/` yet) and — critically — read `frontend/AGENTS.md`'s warning that this pinned Next.js version has training-data-breaking changes, then consulted `frontend/node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` and `.../02-guides/authentication.md` directly. This surfaced that Next.js 16 renamed `middleware.ts` to `proxy.ts` and documents a specific recommended auth architecture (stateless JWT via `jose`, httpOnly cookies, a Data Access Layer `verifySession()`, `proxy.ts` for optimistic-only redirects) — used directly rather than relying on possibly-stale training data.

Filled Technical Context with concrete decisions (no unresolved markers): Python 3.11/FastAPI/SQLModel backend, Next.js 16/TS/Tailwind frontend already in repo, Neon Postgres, pytest+Vitest testing. Ran the Constitution Check against all six articles — all pass, with Article V's compliance resting on the fact that role-scope deferral was already resolved via `/sp.clarify` (not silently skipped). Noted explicitly that because the constitution's `TODO(AUTH_LIBRARY)` defers the Better Auth vs. custom-JWT decision to "the plan.md of the first feature that introduces authentication," and this is that feature, scaffolding minimal auth here is compliance, not scope creep — recorded with no Complexity Tracking entry needed.

Generated all Phase 0/1 artifacts:
- **research.md**: 6 documented decisions with rationale/alternatives — (1) custom JWT over Better Auth (Better Auth is TS/Node-native, doesn't fit the Python/FastAPI/SQLModel backend without a second service), (2) session transport via httpOnly-cookie + Next.js BFF proxy (avoids CORS between Vercel/Render, follows Next 16's own documented pattern), (3) `customer_code` generation via a Postgres sequence (race-safe under concurrency, satisfies FR-007), (4) currency validation via a curated ISO 4217 list kept as a `VARCHAR(10)` app-layer check (matches the client's original schema type), (5) backend tests against real Postgres, not SQLite (preserves `NUMERIC`/sequence fidelity), (6) Argon2 password hashing over bcrypt.
- **data-model.md**: full `Customer` entity (all 19 fields with types/constraints tied back to spec FRs), state-transition diagram (Active↔Inactive, no delete state), and a minimal auth-only `User` entity explicitly scoped to "just enough to gate this feature," with user management itself flagged as a future feature.
- **contracts/customers-api.openapi.yaml**: OpenAPI 3.0 contract covering `/auth/login`, `/customers` (list+create), `/customers/{id}` (get+edit), `/customers/{id}/status` (deactivate/reactivate) — no `DELETE` method exists anywhere, encoding FR-019 at the contract level; monetary fields wire-typed as decimal strings per Article III.
- **quickstart.md**: backend/frontend setup steps, test-running instructions with the constitution's coverage-gate reminder, and a 6-step manual smoke test mapped directly to the spec's 4 user stories plus the auth gate.

Ran `update-agent-context.ps1 -AgentType claude`; it completed without error but made no textual change to the root `CLAUDE.md` since that file predates the SpecKit template and lacks the `## Active Technologies`/`## Recent Changes` markers the script injects into — noted this in plan.md rather than hand-editing the project's custom rules file.

Performed the Post-Phase-1 Constitution re-check (Decimal wire types, RBAC on every path, no DELETE method) — all confirmed, gate remains PASS.

Flagged one ADR suggestion per the constitution's explicit protocol: the authentication & session architecture decision (custom JWT + BFF-proxied httpOnly cookie), since it passes all three of the impact/alternatives/scope tests and is exactly the decision `TODO(AUTH_LIBRARY)` earmarked for ADR treatment. Did not auto-create the ADR — awaiting user consent via `/sp.adr`.

## Outcome

- ✅ Impact: Full Phase 0/1 planning complete for the first backend-requiring feature in the repo — architecture, data model, API contract, and setup docs are ready for `/sp.tasks`.
- 🧪 Tests: none (plan stage; no code written)
- 📁 Files: specs/002-customers-master/plan.md, research.md, data-model.md, contracts/customers-api.openapi.yaml, quickstart.md
- 🔁 Next prompts: `/sp.tasks` to generate the dependency-ordered task list; optionally `/sp.adr "Authentication and Session Architecture"` first if the user wants the auth decision documented before implementation begins.
- 🧠 Reflection: Reading `frontend/AGENTS.md` and the pinned Next.js docs directly (rather than trusting training-data knowledge of "middleware.ts") caught a real breaking change (`proxy.ts` rename) before it could leak into generated code — worth doing this check on every plan touching this frontend, not just once.

## Evaluation notes (flywheel)

- Failure modes observed: `update-agent-context.ps1` reported success but made no file change (silently no-oped against a CLAUDE.md shape it didn't recognize) — not a blocker, but worth flagging so it isn't mistaken for a completed sync in future sessions.
- Graders run and results (PASS/FAIL): Constitution Check (pre- and post-Phase-1) — PASS on both passes.
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): n/a
