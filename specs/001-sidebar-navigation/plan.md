# Implementation Plan: Left Sidebar Navigation

**Branch**: `001-sidebar-navigation` | **Date**: 2026-07-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-sidebar-navigation/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a persistent, client-rendered left sidebar for the Next.js App Router frontend with four fixed, independently-collapsible groups (Masters, Inputs, Registers, Reports) whose sub-items link to namespaced placeholder routes (e.g. `/inputs/sales` vs. `/registers/sales`). The sidebar lives in a shared route-group layout so its expand/collapse state and active-route highlight survive client-side navigation; navigation structure is a single static TypeScript config, not fetched data. No backend or database changes are required — this feature is a pure frontend routing/UI shell behind the existing (to-be-introduced) auth gate.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20 LTS
**Primary Dependencies**: Next.js (App Router, latest stable), React 18+, Tailwind CSS
**Storage**: N/A — navigation structure is a static in-code config; no database reads/writes in this feature
**Testing**: Vitest + React Testing Library (frontend, per constitution); no backend tests needed (no backend surface touched)
**Target Platform**: Web browser (desktop + mobile viewports), deployed to Vercel
**Project Type**: Web application — frontend-only slice of a planned frontend+backend system (Option 2 structure; only `frontend/` is created by this feature, `backend/` is reserved for when a backend-touching feature arrives)
**Performance Goals**: Group expand/collapse and active-route highlight update MUST feel instantaneous (no visible delay) since both are pure client-side state/CSS changes with no network round-trip
**Constraints**: No backend/API calls; must render correctly at both desktop and mobile (off-canvas) viewport widths per FR-013; sidebar state (expanded groups) must persist across client-side route changes within the app shell, not reset on every navigation
**Scale/Scope**: 4 groups, 20 sub-items total (Masters 3 + Inputs 6 + Registers 6 + Reports 5), 1 shared layout, 1 navigation config, 20 placeholder route pages

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Requirement | Status | Notes |
|---|---|---|---|
| I. SDD (NON-NEGOTIABLE) | spec → clarify → plan → tasks, before code | **PASS** | `spec.md` complete, `/sp.clarify` resolved all 3 flagged ambiguities plus the RBAC gap surfaced during this plan; `plan.md` (this file) precedes any implementation. |
| II. TDD (NON-NEGOTIABLE) | Red-Green-Refactor for all implementation | **PASS (planned)** | Phase 1 design + `/sp.tasks` will enumerate Vitest/RTL tests written before each component/route is implemented; enforced at task level, not this gate. |
| III. Financial Data Integrity | Decimal-only money | **N/A** | Feature has no monetary values — pure navigation shell. |
| IV. Immutable Ledger | Append-only ledger writes | **N/A** | No ledger reads/writes; no database access at all. |
| V. RBAC From Day One | Spec must declare roles before `/sp.plan` | **PASS (with tracked deferral)** | FR-015 added: authentication required (default-deny for unauthenticated users); specific role scoping among admin/accountant/subscriber explicitly deferred as `TODO(NAV_ROLE_SCOPE)` since the client hasn't specified it yet — mirrors the constitution's own `TODO(AUTH_LIBRARY)` deferral pattern rather than silently shipping unauthenticated. |
| VI. Secrets Management | No hardcoded secrets | **N/A** | No secrets, keys, or credentials touched by this feature. |

**Gate result**: PASS. No Complexity Tracking entries required — no violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-sidebar-navigation/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md         # Phase 1 output (/sp.plan command)
├── quickstart.md         # Phase 1 output (/sp.plan command)
├── contracts/            # Phase 1 output (/sp.plan command) — intentionally empty, see research.md
└── tasks.md              # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
frontend/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx                     # Persistent shell: renders <Sidebar /> + {children}
│   │   ├── masters/
│   │   │   ├── customers/page.tsx         # Placeholder page
│   │   │   ├── vendors/page.tsx           # Placeholder page
│   │   │   └── chart-of-accounts/page.tsx # Placeholder page
│   │   ├── inputs/
│   │   │   ├── sales/page.tsx             # Placeholder page (namespaced, distinct from registers/sales)
│   │   │   ├── purchase/page.tsx
│   │   │   ├── receipt/page.tsx
│   │   │   ├── payment/page.tsx
│   │   │   ├── petty-cash/page.tsx
│   │   │   └── journal/page.tsx
│   │   ├── registers/
│   │   │   ├── sales/page.tsx             # Placeholder page (namespaced, distinct from inputs/sales)
│   │   │   ├── purchase/page.tsx
│   │   │   ├── receipt/page.tsx
│   │   │   ├── payment/page.tsx
│   │   │   ├── petty-cash/page.tsx
│   │   │   └── journal/page.tsx
│   │   └── reports/
│   │       ├── ledger/page.tsx
│   │       ├── ageing/page.tsx
│   │       ├── trial-balance/page.tsx
│   │       ├── profit-loss/page.tsx
│   │       └── balance-sheet/page.tsx
│   └── layout.tsx                          # Root layout
├── components/
│   ├── sidebar/
│   │   ├── Sidebar.tsx                     # Top-level sidebar shell (desktop + mobile toggle wiring)
│   │   ├── NavGroup.tsx                    # One collapsible group (header + sub-item list)
│   │   ├── NavItem.tsx                     # One sub-item link, active-state aware
│   │   └── nav-config.ts                   # Static NAV_CONFIG: groups, sub-items, hrefs, order
│   └── placeholder/
│       └── PlaceholderPage.tsx             # Shared "not yet built" page body
├── tests/
│   ├── components/
│   │   ├── Sidebar.test.tsx                # Group order, expand/collapse, independent toggles
│   │   ├── NavItem.test.tsx                # Active-state highlighting given a pathname
│   │   └── nav-config.test.ts              # Route namespacing: no Inputs/Registers collisions
│   └── integration/
│       └── deep-link-expand.test.tsx       # Deep link auto-expands correct parent group
└── package.json / tsconfig.json / tailwind.config.ts / vitest.config.ts
```

**Structure Decision**: Frontend-only feature under a new `frontend/` directory (Next.js App Router), kept separate from a future `backend/` (FastAPI) directory per the constitution's locked dual-stack layout — even though this feature doesn't touch the backend, establishing `frontend/` now avoids a later restructuring migration. A `(dashboard)` route group holds a single shared `layout.tsx` so the `Sidebar` component (and its expand/collapse state) persists across all client-side navigations between sub-item pages, per FR-014's "don't reset on every navigation" requirement. Every sub-item gets its own real route folder (not a catch-all `[...slug]` route) so that when the client reveals a page's real requirements one at a time (starting with Customers), that route's `page.tsx` can be replaced in isolation without touching a shared dynamic handler.

## Complexity Tracking

*No entries — Constitution Check gate passed with no violations requiring justification.*
