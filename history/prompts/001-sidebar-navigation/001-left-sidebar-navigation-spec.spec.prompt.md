---
id: 001
title: Left sidebar navigation spec
stage: spec
date: 2026-07-14
surface: agent
model: claude-sonnet-5
feature: 001-sidebar-navigation
branch: 001-sidebar-navigation
user: codewithurooj
command: /sp.specify
labels: ["navbar", "sidebar", "navigation", "routing", "frontend"]
links:
  spec: specs/001-sidebar-navigation/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/001-sidebar-navigation/spec.md
 - specs/001-sidebar-navigation/checklists/requirements.md
 - history/prompts/001-sidebar-navigation/001-left-sidebar-navigation-spec.spec.prompt.md
tests:
 - none (spec stage; no code written)
---

## Prompt

navbar (left sidebar navigation) for the subscription accounting software.

REQUIREMENTS
Build a left sidebar navigation with 4 top-level expandable/collapsible groups, in this exact order, each expanding to reveal its sub-items as links:

1. Masters
   - Customers
   - Vendors
   - Chart of Accounts

2. Inputs
   - Sales
   - Purchase
   - Receipt
   - Payment
   - Petty Cash
   - Journal

3. Registers
   - Sales
   - Purchase
   - Receipt
   - Payment
   - Petty Cash
   - Journal

4. Reports
   - Ledger
   - Ageing
   - Trial Balance
   - Profit & Loss
   - Balance Sheet

BEHAVIOR
- Groups are collapsible/expandable (accordion-style); clicking a group header toggles its sub-items open/closed.
- Note that "Inputs" and "Registers" contain identically-named sub-items (Sales, Purchase, Receipt, Payment, Petty Cash, Journal) — these are distinct pages (Inputs = data entry forms, Registers = logs/listings of existing entries), so routes/links must be namespaced by parent group (e.g. /inputs/sales vs /registers/sales) to avoid collisions.
- Highlight the active/current route in the sidebar.
- Sub-item links should route to placeholder pages for now — the client is revealing each page's actual requirements one at a time, starting with "Customers" under Masters, so only the navbar shell and routing structure are in scope for this feature. Do not build out page content beyond a placeholder.

SCOPE
- This is ONLY the navbar/sidebar component and routing shell, not the pages it links to.
- Follow this project's SDD workflow: after /sp.specify, run /sp.clarify to surface any ambiguities (e.g. responsive/mobile behavior, whether multiple groups can be expanded simultaneously or only one at a time, icon usage), then /sp.plan, /sp.tasks, and /sp.implement.
- Follow TDD per the constitution: write component/interaction tests first (React Testing Library + Vitest), then implement to pass them.
- Use the locked-in stack: Next.js (App Router), TypeScript, Tailwind CSS.

## Response snapshot

Created branch `001-sidebar-navigation` and `specs/001-sidebar-navigation/spec.md` via `.specify/scripts/powershell/create-new-feature.ps1`. Wrote a full spec with 3 prioritized user stories (P1: browse/expand groups and open pages, P2: Inputs vs Registers namespacing to prevent route collisions, P3: active-route highlighting including deep links), edge cases, 14 functional requirements, 2 key entities, and 4 measurable success criteria. Deliberately left 3 `[NEEDS CLARIFICATION]` markers (FR-012 multi-expand vs. strict accordion, FR-013 mobile/responsive behavior, FR-014 default expand state on load) rather than defaulting them, since the user explicitly flagged these exact three ambiguities to be resolved via `/sp.clarify` next. Icon usage was resolved with a documented default (no icons for this iteration) since it doesn't affect scope. Generated `checklists/requirements.md` — all items pass except "no NEEDS CLARIFICATION markers remain," which is expected and documented as pending the clarify pass.

## Outcome

- ✅ Impact: Feature spec ready for `/sp.clarify` to resolve the 3 flagged ambiguities, then `/sp.plan`.
- 🧪 Tests: none (spec stage; no code written)
- 📁 Files: specs/001-sidebar-navigation/spec.md, specs/001-sidebar-navigation/checklists/requirements.md
- 🔁 Next prompts: /sp.clarify (resolve FR-012/013/014), then /sp.plan, /sp.tasks, /sp.implement
- 🧠 Reflection: Kept the 3 clarification markers instead of assuming defaults because the user's own message named exactly these three ambiguities as intended /sp.clarify targets — collapsing them into assumptions would have skipped a step the user explicitly asked for.

## Evaluation notes (flywheel)

- Failure modes observed: initial PowerShell invocation of create-new-feature.ps1 printed a spurious "positional parameter 'prompts'" error to stderr after the script had already completed successfully (branch created, spec dir + spec.md + prompts dir all present); verified via filesystem inspection rather than trusting the tool's error output.
- Graders run and results (PASS/FAIL): spec quality checklist — PASS on all items except NEEDS CLARIFICATION (expected, by design).
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): n/a
