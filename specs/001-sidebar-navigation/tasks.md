---

description: "Task list for feature implementation"
---

# Tasks: Left Sidebar Navigation

**Input**: Design documents from `/specs/001-sidebar-navigation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/README.md, quickstart.md (all present)

**Tests**: Included and REQUIRED. The constitution's Article II (Test-Driven Development) is NON-NEGOTIABLE for this project — every implementation task below is preceded by a test task that must be written and observed failing before the corresponding implementation task begins.

**Organization**: Tasks are grouped by user story (from spec.md: US1/P1, US2/P2, US3/P3) to enable independent implementation and testing of each story. FR-013's mobile/responsive behavior does not map to any single user story in spec.md (it was resolved as a cross-cutting functional requirement during `/sp.clarify`), so it gets its own cross-cutting phase between the user stories and final polish, per the "Setup/Foundational/Polish phases carry no story label" convention.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3); omitted for Setup/Foundational/cross-cutting/Polish tasks
- All file paths are relative to the repository root

## Path Conventions

Per `plan.md`'s Project Structure (Option 2 / web application, frontend-only for this feature):

- App routes: `frontend/app/`
- Components: `frontend/components/`
- Tests: `frontend/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the `frontend/` Next.js app and its tooling. No feature code yet.

- [X] T001 Initialize Next.js (App Router, TypeScript) project in `frontend/` per `plan.md`'s Project Structure
- [X] T002 [P] Configure Tailwind CSS in `frontend/` (Tailwind v4 CSS-first config via `postcss.config.mjs` + `@import "tailwindcss"` in `app/globals.css`; no `tailwind.config.ts` needed in v4)
- [X] T003 [P] Configure Vitest + React Testing Library in `frontend/` (`vitest.config.ts`, `frontend/tests/setup.ts`)
- [X] T004 [P] Configure ESLint/Prettier for `frontend/` consistent with repo conventions (`eslint.config.mjs` from scaffold, `.prettierrc.json` added)

**Checkpoint**: `npm run dev` serves an empty Next.js app; `npm run test` runs (zero tests, exits clean).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared artifacts every user story depends on — the navigation data, the placeholder page primitive, all 20 real routes, and the layout shell.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 [P] Write failing test asserting `NAV_CONFIG` has exactly 4 groups in fixed order (Masters, Inputs, Registers, Reports) and exactly 20 total sub-items with every `href` globally unique (covering the 6 shared Inputs/Registers labels), in `frontend/tests/unit/nav-config.test.ts`
- [X] T006 Implement `NAV_CONFIG` in `frontend/components/sidebar/nav-config.ts` using the full 20-row enumeration from `data-model.md`, to make T005 pass
- [X] T007 [P] Write failing test asserting `PlaceholderPage` renders its given group label and item title plus a "not yet built" indicator, in `frontend/tests/components/PlaceholderPage.test.tsx`
- [X] T008 Implement `PlaceholderPage` component in `frontend/components/placeholder/PlaceholderPage.tsx` (props: `group: string`, `title: string`), to make T007 pass
- [X] T009 Create root layout in `frontend/app/layout.tsx`
- [X] T010 Create `(dashboard)` route-group layout skeleton in `frontend/app/(dashboard)/layout.tsx` (renders `{children}` only for now; `<Sidebar />` is mounted in Phase 3), depends on T009. Home page moved to `frontend/app/(dashboard)/page.tsx` (replacing the scaffold's `app/page.tsx`) so `/` renders inside the dashboard layout and gets the sidebar too.
- [X] T011 [P] Generate all 20 placeholder route files under `frontend/app/(dashboard)/{masters,inputs,registers,reports}/<slug>/page.tsx` per `data-model.md`'s enumeration, each rendering `<PlaceholderPage group="..." title="..." />` with its own group/title so every route (including the 6 Inputs/Registers pairs) shows distinguishable content, depends on T006, T008. Verified via `next build`: all 20 routes + `/` compile and prerender as distinct static routes.

**Checkpoint**: All 20 routes resolve and render distinct placeholder content; no sidebar UI exists yet. Foundation ready for user story implementation.

---

## Phase 3: User Story 1 - Browse and open a section via the sidebar (Priority: P1) 🎯 MVP

**Goal**: A user sees all four groups in order, can expand/collapse any of them independently, and clicking a sub-item navigates to its page.

**Independent Test**: Load the app, confirm all four groups appear in order, expand each and confirm correct sub-items in order, click a sub-item and confirm navigation. Fully testable with only Phase 1/2 complete.

### Tests for User Story 1 ⚠️

> Write these tests FIRST, run them, and confirm they FAIL before starting implementation below.

- [X] T012 [P] [US1] Failing test: `Sidebar` renders exactly four group headers in this order — Masters, Inputs, Registers, Reports (FR-001) — in `frontend/tests/components/Sidebar.test.tsx`
- [X] T013 [P] [US1] Failing test: on initial render with no matching route, all four groups render collapsed (FR-014) — in `frontend/tests/components/Sidebar.test.tsx`
- [X] T014 [P] [US1] Failing test: clicking a `NavGroup` header reveals its sub-items in the specified order, and clicking again hides them (FR-002) — in `frontend/tests/components/NavGroup.test.tsx`
- [X] T015 [P] [US1] Failing test: expanding one group does not collapse another already-expanded group (independent toggles, FR-012) — in `frontend/tests/components/Sidebar.test.tsx`
- [X] T016 [P] [US1] Failing test: `NavItem` renders as a link with the correct `href` and label text (FR-007) — in `frontend/tests/components/NavItem.test.tsx`

### Implementation for User Story 1

- [X] T017 [US1] Implement `NavItem` component (renders Next.js `Link` with `href` + label) in `frontend/components/sidebar/NavItem.tsx`, to make T016 pass
- [X] T018 [US1] Implement `NavGroup` component (accessible disclosure `<button aria-expanded>` header + conditionally rendered `<ul>` of `NavItem`s per `research.md`'s ARIA pattern) in `frontend/components/sidebar/NavGroup.tsx`, depends on T017, makes T014 pass
- [X] T019 [US1] Implement `Sidebar` component (maps `NAV_CONFIG` to a list of `NavGroup`s, holds one `isExpanded` boolean per group defaulting to `false`, independent toggle handlers) in `frontend/components/sidebar/Sidebar.tsx`, depends on T018, makes T012/T013/T015 pass
- [X] T020 [US1] Mount `<Sidebar />` inside `frontend/app/(dashboard)/layout.tsx`, depends on T019 and T010. Verified: `npm run test` (15/15 passing) and `next build` (all 21 routes compile) both green.

**Checkpoint**: User Story 1 is fully functional and independently testable/demoable.

---

## Phase 4: User Story 2 - Distinguish identically-named Inputs and Registers pages (Priority: P2)

**Goal**: The six shared labels (Sales, Purchase, Receipt, Payment, Petty Cash, Journal) under Inputs and Registers route to distinct, distinguishable pages and highlight independently.

**Independent Test**: From a collapsed sidebar, expand Inputs and click "Sales"; confirm the route and highlighted item differ from expanding Registers and clicking "Sales". Repeat for all six shared labels.

### Tests for User Story 2 ⚠️

- [X] T021 [P] [US2] Failing test: given current pathname `/inputs/sales`, only the Inputs > Sales `NavItem` is marked active — the Registers > Sales `NavItem` (same label) is not (FR-009, FR-008) — in `frontend/tests/components/NavItem.test.tsx`
- [X] T022 [P] [US2] Failing integration test: rendering the placeholder route tree at `/inputs/sales` and at `/registers/sales` produces distinguishable content for each (group label differs), for all 6 shared labels (FR-008, SC-002) — in `frontend/tests/integration/inputs-registers-namespacing.test.tsx`. Passed immediately (no red phase) — proves T006/T008/T011's foundational route/data design was already correct.

### Implementation for User Story 2

- [X] T023 [US2] Add active-state resolution to `NavItem` via `usePathname()` (marks itself active only when its own `href` exactly matches the current pathname; sets `aria-current="page"` and an active style) in `frontend/components/sidebar/NavItem.tsx`, makes T021 pass
- [X] T024 [US2] Verify/adjust the 6 shared-label placeholder route pairs from T011 so each pair's `group` prop passed to `PlaceholderPage` is correctly namespaced and distinguishable in rendered output, in `frontend/app/(dashboard)/inputs/{sales,purchase,receipt,payment,petty-cash,journal}/page.tsx` and `frontend/app/(dashboard)/registers/{sales,purchase,receipt,payment,petty-cash,journal}/page.tsx`, makes T022 pass. No changes needed — already correct from T011.

**Checkpoint**: User Stories 1 AND 2 both work independently; the Inputs/Registers collision risk is proven closed.

---

## Phase 5: User Story 3 - Know where you are in the app (Priority: P3)

**Goal**: The sidebar always reflects the current page, including on deep link / refresh, with the correct parent group auto-expanded.

**Independent Test**: Navigate to a sub-item page (including via direct URL / refresh), confirm the correct group is expanded and the correct sub-item is marked active, with no other sub-item active.

### Tests for User Story 3 ⚠️

- [X] T025 [P] [US3] Failing test: given the current pathname matches a sub-item, `Sidebar` initializes with that item's parent group expanded and all other groups collapsed (FR-010, FR-014) — in `frontend/tests/components/Sidebar.test.tsx`
- [X] T026 [P] [US3] Failing test: given a pathname outside all nav routes (e.g. `/`), no `NavItem` anywhere in the tree is marked active (edge case from spec.md) — in `frontend/tests/components/Sidebar.test.tsx`
- [X] T027 [P] [US3] Failing integration test: simulating a direct navigation/refresh to a sub-item route (e.g. `/reports/trial-balance`) renders the correct parent group expanded and that item active, matching `quickstart.md` step 5 — in `frontend/tests/integration/deep-link-expand.test.tsx`

### Implementation for User Story 3

- [X] T028 [US3] Add pathname-based initial-expand derivation to `Sidebar` (on mount, find the group whose items include a matching `href` and seed its `isExpanded` to `true`; all other groups start `false`) in `frontend/components/sidebar/Sidebar.tsx`, depends on T019, T023, makes T025/T027 pass
- [X] T029 [US3] Confirm/adjust `NavItem`'s active-state resolution (T023) correctly yields "no match" for pathnames outside all 20 routes, in `frontend/components/sidebar/NavItem.tsx`, makes T026 pass. No change needed — strict `pathname === item.href` equality already yields false for any non-matching route.

**Checkpoint**: All three user stories are independently functional; full desktop behavior is complete per spec.md.

---

## Phase 6: Responsive / Mobile Behavior (Cross-Cutting, FR-013)

**Purpose**: Off-canvas sidebar behavior on narrow viewports, per the `/sp.clarify` resolution ("responsive for all screens" → off-canvas + hamburger toggle). Does not map to a single user story; builds on the Phase 3 `Sidebar`.

- [X] T030 [P] Failing test: a visible menu/hamburger toggle button is always rendered and the sidebar panel is closed by default (FR-013) — in `frontend/tests/components/Sidebar.test.tsx`. Note: jsdom has no real viewport/media-query rendering, so "narrow viewport" is verified structurally via the `data-mobile-open` attribute and the toggle's `aria-expanded`, not actual CSS breakpoint evaluation (real breakpoint behavior is Tailwind `md:` classes, confirmed visually via quickstart.md).
- [X] T031 [P] Failing test: clicking the hamburger toggle opens the off-canvas panel; clicking the backdrop closes it — in `frontend/tests/components/MobileNavToggle.test.tsx`
- [X] T032 [P] Failing integration test: the mobile panel auto-closes when the pathname changes while open (FR-013) — in `frontend/tests/integration/mobile-nav-close-on-navigate.test.tsx`
- [X] T033 Implement `MobileNavToggle` (hamburger button + conditional backdrop, controlled via `isOpen`/`onToggle`/`onClose` props) in `frontend/components/sidebar/MobileNavToggle.tsx`, integrated into `Sidebar.tsx`, makes T030/T031 pass. State was lifted into `Sidebar` (not held locally in `MobileNavToggle`) so T035's close-on-navigate effect can reach it.
- [X] T034 Add Tailwind responsive classes to `Sidebar` (off-canvas transform below `md:`, permanently visible at `md:` and above) in `frontend/components/sidebar/Sidebar.tsx`, depends on T033
- [X] T035 Close the mobile panel automatically on pathname change (effect keyed on `usePathname()`) in `frontend/components/sidebar/Sidebar.tsx`, makes T032 pass

**Checkpoint**: Sidebar is fully responsive per FR-013; all prior desktop-only tests still pass.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final quality pass across all stories.

- [X] T036 [P] Review ARIA attributes (`aria-expanded`, `aria-controls`, `aria-current`) across `Sidebar`/`NavGroup`/`NavItem` against `research.md`'s disclosure-widget decision. Confirmed correct; also found and fixed a real gap during browser verification — `NavItem` set `aria-current` but had no visual style difference, so FR-009's "visually highlight" wasn't actually met. Added active-state styling (bold/blue).
- [X] T037 Run `quickstart.md`'s 7-step manual verification against the running `frontend` dev server and record any deviation. Verified live in a browser: steps 1-6 (group order/collapse, independent toggles, Inputs/Registers namespacing at `/inputs/sales` vs `/registers/sales`, active highlighting, deep-link auto-expand at `/masters/vendors`, placeholder pages) all confirmed working correctly with screenshots. Step 7 (mobile off-canvas) could not be visually confirmed via a real narrow viewport — this sandboxed browser's window-resize does not affect the rendered viewport — but DOM inspection at desktop width confirmed the toggle button is correctly absent from the interactive tree (`md:hidden` applied), and the mechanism is covered by T030-T032's passing structural tests.
- [X] T038 Remove any unused Next.js scaffold boilerplate left over from T001. Removed 5 unused scaffold SVGs (`public/{file,globe,next,vercel,window}.svg`) left over from the default homepage that was replaced in T010; also fixed a `react-hooks/set-state-in-effect` ESLint error found during this pass by refactoring the mobile-panel close-on-navigate logic (T035) from a `useEffect` + `setState` to React's recommended "adjust state during render" pattern.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion — no dependency on US2/US3
- **User Story 2 (Phase 4)**: Depends on Foundational completion; reuses `NavItem`/placeholder routes built in Phase 3/2 (T017, T011) — independently testable once Phase 3 is done
- **User Story 3 (Phase 5)**: Depends on Foundational + Phase 3's `Sidebar`/`NavItem` (T019, T023) — independently testable once Phase 3/4 are done
- **Responsive/Mobile (Phase 6)**: Depends on Phase 3's `Sidebar` (T019) existing
- **Polish (Phase 7)**: Depends on all prior phases

### Within Each Phase

- Tests MUST be written and observed failing before their corresponding implementation task
- `NavItem` before `NavGroup` before `Sidebar` (component composition order)
- Story complete (checkpoint) before moving to the next priority

### Parallel Opportunities

- All Setup tasks marked [P] (T002–T004) run in parallel after T001
- T005/T006 and T007/T008 pairs in Foundational can proceed in parallel with each other (different files); T011 depends on both pairs completing
- All [P] test tasks within a story phase (e.g., T012–T016) can be written in parallel
- Once Phase 3 (US1) is done, Phase 4 (US2) and Phase 5 (US3) touch mostly disjoint files (`NavItem.tsx` is shared — coordinate T023/T028/T029 sequentially if the same engineer isn't doing both) and could be staffed in parallel by different developers with care

---

## Parallel Example: User Story 1

```bash
# Launch all Phase 3 tests together:
Task: "Failing test: Sidebar renders four group headers in order in frontend/tests/components/Sidebar.test.tsx"
Task: "Failing test: all four groups collapsed by default in frontend/tests/components/Sidebar.test.tsx"
Task: "Failing test: NavGroup toggles sub-items open/closed in frontend/tests/components/NavGroup.test.tsx"
Task: "Failing test: independent toggles - expanding one group doesn't collapse another in frontend/tests/components/Sidebar.test.tsx"
Task: "Failing test: NavItem renders correct href and label in frontend/tests/components/NavItem.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (blocks everything)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run `quickstart.md` steps 1–2 manually; confirm Sidebar.test.tsx / NavGroup.test.tsx / NavItem.test.tsx all pass
5. Demo: a working, expandable sidebar navigating to 20 placeholder pages — no active-highlighting or mobile support yet

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → validate independently → MVP demo
3. Add User Story 2 → validate independently (namespacing proven) → demo
4. Add User Story 3 → validate independently (active-state + deep link) → demo
5. Add Responsive/Mobile (Phase 6) → validate on narrow viewport → demo
6. Polish (Phase 7) → final quickstart.md full run → ship

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability; Setup/Foundational/Responsive/Polish carry no story label per the constitution's task-format convention
- Every implementation task above has a preceding test task per Article II (TDD, NON-NEGOTIABLE) — do not mark an implementation task complete until its test was observed red, then green
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently before proceeding
- `TODO(NAV_ROLE_SCOPE)` from spec.md FR-015 is out of scope for this task list — no auth/RBAC implementation task exists here since the underlying auth mechanism belongs to whichever feature first introduces authentication (per the constitution's `TODO(AUTH_LIBRARY)` deferral)
