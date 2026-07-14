---
id: 004
title: Generate sidebar navigation tasks
stage: tasks
date: 2026-07-14
surface: agent
model: claude-sonnet-5
feature: 001-sidebar-navigation
branch: 001-sidebar-navigation
user: codewithurooj
command: /sp.tasks
labels: ["navbar", "sidebar", "navigation", "tasks", "tdd"]
links:
  spec: specs/001-sidebar-navigation/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/001-sidebar-navigation/tasks.md
 - history/prompts/001-sidebar-navigation/004-generate-sidebar-navigation-tasks.tasks.prompt.md
tests:
 - none (tasks stage; tasks.md enumerates future test tasks, no code/tests written yet)
---

## Prompt

(No additional free-text argument was provided to `/sp.tasks`; the command ran against the active feature's plan/spec/design docs in `specs/001-sidebar-navigation/`.)

## Response snapshot

Ran `.specify/scripts/powershell/check-prerequisites.ps1 -Json` to confirm `FEATURE_DIR` and available docs (research.md, data-model.md, contracts/, quickstart.md all present alongside required plan.md/spec.md). Generated `tasks.md` with 38 tasks across 7 phases, organized by user story per spec.md's priorities:

- **Phase 1 (Setup, T001–T004)**: Next.js/TypeScript init, Tailwind, Vitest+RTL, lint config.
- **Phase 2 (Foundational, T005–T011, blocking)**: `NAV_CONFIG` (test-first, verifying the 20-item/unique-href invariant from data-model.md), shared `PlaceholderPage` component (test-first), root + `(dashboard)` layout skeleton, all 20 real placeholder route files generated from the data model.
- **Phase 3 (US1/P1, T012–T020, 🎯 MVP)**: test-first `NavItem`/`NavGroup`/`Sidebar` build — group order, default-collapsed state, independent expand/collapse toggles, link rendering.
- **Phase 4 (US2/P2, T021–T024)**: active-state resolution on `NavItem` plus an integration test proving Inputs/Registers shared-label routes render distinguishable content — deliberately reuses US1's components rather than duplicating them, since namespacing correctness falls out of the foundational route/data design.
- **Phase 5 (US3/P3, T025–T029)**: pathname-based initial-expand derivation on `Sidebar` for deep-link/refresh support, plus the "no route match → no active item" edge case.
- **Phase 6 (Responsive/Mobile, T030–T035, cross-cutting, no [Story] label)**: off-canvas panel + hamburger toggle + auto-close-on-navigate, covering FR-013 which was resolved during `/sp.clarify` but doesn't map to any single spec.md user story.
- **Phase 7 (Polish, T036–T038)**: ARIA review, `quickstart.md` manual validation run, scaffold cleanup.

Every implementation task is preceded by a failing-test task per the constitution's non-negotiable Article II; documented explicitly in the Notes section that no task should be marked complete without its test observed red-then-green first. Also documented the deliberate design tension (Foundational's `NAV_CONFIG`/route creation front-loads work that spec.md's User Story 2 later "tests against" rather than newly implements) so a future reader understands why US2's implementation section is thin. Explicitly noted in the final Notes bullet that `TODO(NAV_ROLE_SCOPE)` (FR-015) has no corresponding task here — auth/RBAC enforcement is out of scope for this feature, deferred to whichever future feature introduces authentication.

## Outcome

- ✅ Impact: 38-task, dependency-ordered, TDD-enforced task breakdown ready for `/sp.implement`; MVP scope (Phase 1–3, User Story 1) clearly identified.
- 🧪 Tests: none written yet — tasks.md enumerates the test tasks to be executed test-first during implementation
- 📁 Files: specs/001-sidebar-navigation/tasks.md
- 🔁 Next prompts: /sp.implement (or /sp.analyze first, if a final cross-artifact consistency pass is wanted before implementation)
- 🧠 Reflection: Chose to keep FR-013 (mobile/responsive) as an unlabeled cross-cutting phase rather than forcing it into one of the three spec.md user stories, since it never mapped cleanly to any of them — it was a clarification answer, not a spec.md story. This matches the "Setup/Foundational/Polish carry no story label" convention already established in the tasks template.

## Evaluation notes (flywheel)

- Failure modes observed: none this session.
- Graders run and results (PASS/FAIL): task-format validation (every task has checkbox, sequential ID, [P] only where files are disjoint, [Story] label only on US-phase tasks, exact file paths) — PASS on manual review of all 38 tasks.
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): n/a
