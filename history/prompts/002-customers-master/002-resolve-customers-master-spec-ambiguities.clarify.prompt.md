---
id: 002
title: Resolve customers master spec ambiguities
stage: clarify
date: 2026-07-14
surface: agent
model: claude-sonnet-5
feature: 002-customers-master
branch: 002-customers-master
user: codewithurooj
command: /sp.clarify
labels: ["customers", "masters", "crud", "clarification", "financial-data"]
links:
  spec: specs/002-customers-master/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/002-customers-master/spec.md
 - specs/002-customers-master/checklists/requirements.md
 - history/prompts/002-customers-master/002-resolve-customers-master-spec-ambiguities.clarify.prompt.md
tests:
 - none (clarify stage; no code written)
---

## Prompt

/sp.clarify

(No additional user-supplied arguments; command run against the current feature branch `002-customers-master` and its spec at `specs/002-customers-master/spec.md`.)

## Response snapshot

Ran `.specify/scripts/powershell/check-prerequisites.ps1 -Json -PathsOnly` to resolve `FEATURE_DIR`/`FEATURE_SPEC`, then performed a structured ambiguity/coverage scan of `spec.md` against the full taxonomy (functional scope, domain/data model, UX flow, non-functional attributes, integrations, edge cases, constraints, terminology, completion signals). Identified 4 material, unresolved items and asked them one at a time via multiple-choice questions with a recommended option:

1. Internal contradiction: User Story 4 referenced an "active only view" excluding Inactive customers, but no FR defined a status filter on the list → resolved as filterable, defaulting to showing both Active and Inactive, with an optional Active-only/Inactive-only filter (FR-013 updated; new acceptance scenario added to Story 2).
2. Concurrent-edit conflict handling (unspecified) → resolved as last-write-wins, no optimistic locking for v1 (new FR-025; new acceptance scenario on Story 3; new edge case).
3. Whether opening_balance stays editable after creation like other fields, or becomes locked like customer_code → resolved as locked/immutable after creation, since it represents a fixed onboarding snapshot (new FR-024; FR-017 and Story 3's acceptance scenarios updated to exclude it from editable fields; new edge case).
4. Search matching behavior (substring vs. prefix) and target data scale for pagination/search design → resolved as substring match across customer_code/customer_name/contact_person at a ~5,000-record scale, consistent with existing SC-003 (FR-014 updated; new Assumptions bullet).

Each accepted answer was appended to the spec's existing `## Clarifications` → `### Session 2026-07-14` section and immediately integrated into the corresponding User Story, Functional Requirement, Edge Cases, or Assumptions section, saving after each batch of edits (no duplicate bullets, no contradictory leftover text — FR-017's superseded "except id, customer_code, and created_at" wording was replaced in place rather than duplicated). Updated `checklists/requirements.md` with a Notes entry summarizing this session. Verified via grep that no `[NEEDS CLARIFICATION]` markers remain anywhere in `spec.md`.

## Outcome

- ✅ Impact: 4 additional ambiguities (1 internal contradiction, 3 missing decisions) resolved and integrated; spec.md now internally consistent with 25 functional requirements, 10 edge cases, and updated acceptance scenarios across all 4 user stories.
- 🧪 Tests: none (clarify stage; no code written)
- 📁 Files: specs/002-customers-master/spec.md, specs/002-customers-master/checklists/requirements.md
- 🔁 Next prompts: `/sp.plan` — spec is now ready for architecture/design planning (FastAPI + SQLModel + Neon backend scaffold, API contracts, frontend table/form architecture).
- 🧠 Reflection: The taxonomy scan caught a real contradiction (Story 4 vs. missing filter FR) that a surface read of the spec had missed during `/sp.specify` — running `/sp.clarify` as a distinct second pass, after the author has "cooled off" from writing the first draft, is valuable even when `/sp.specify` already resolved its own 3 markers.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): spec quality checklist — PASS (all items); manual grep for residual `[NEEDS CLARIFICATION]` markers — PASS (none found)
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): n/a
