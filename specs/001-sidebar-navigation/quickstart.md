# Quickstart: Left Sidebar Navigation

**Feature**: 001-sidebar-navigation | **Date**: 2026-07-14

This is a manual verification guide for the feature once `/sp.tasks` + `/sp.implement` have produced the `frontend/` app described in `plan.md`. It is not a substitute for the Vitest/RTL tests enumerated in `tasks.md` — it's the fastest way for a human to confirm the feature behaves as specified end-to-end in a browser.

## Prerequisites

- `frontend/` app installed (`npm install` inside `frontend/`) and running (`npm run dev`), reachable at `http://localhost:3000`.
- All Vitest/RTL tests passing (`npm run test` inside `frontend/`).

## Steps

1. **Group order and default collapsed state** (FR-001, FR-014)
   - Load the app's root/home route at `http://localhost:3000/` (not a sub-item route — this step checks the sidebar's default state, not deep-link behavior).
   - Confirm the sidebar shows exactly four group headers, top to bottom: Masters, Inputs, Registers, Reports.
   - Confirm all four groups render collapsed (no sub-items visible) since no route matches a sub-item yet.

2. **Expand/collapse and independent toggles** (FR-002, FR-012)
   - Click "Masters" — confirm its three sub-items (Customers, Vendors, Chart of Accounts) appear, in that order.
   - Click "Inputs" — confirm Masters remains expanded AND Inputs also expands (both open at once), showing its six sub-items (Sales, Purchase, Receipt, Payment, Petty Cash, Journal) in that order.
   - Click "Masters" again — confirm only Masters collapses; Inputs remains expanded.

3. **Namespaced routing, no Inputs/Registers collision** (FR-008, User Story 2)
   - With Inputs expanded, click "Sales" — confirm the URL is `/inputs/sales` and the page clearly identifies itself as the Inputs > Sales placeholder.
   - Expand "Registers" and click "Sales" — confirm the URL is `/registers/sales` (different from `/inputs/sales`) and the page identifies itself as the Registers > Sales placeholder.
   - Repeat spot-checks for at least one more shared label (e.g. Journal) to confirm `/inputs/journal` vs `/registers/journal` are distinct.

4. **Active-route highlighting** (FR-009, User Story 3)
   - While on `/inputs/sales`, confirm the "Sales" entry under Inputs is visually marked active, and no other sub-item (including Registers > Sales) is marked active.
   - Click "Vendors" under Masters — confirm Vendors becomes the sole active item and Inputs > Sales is no longer marked active.

5. **Deep link / refresh auto-expand** (FR-010, FR-014)
   - Directly navigate the browser to `/reports/trial-balance` (paste the URL, don't click through the sidebar).
   - Confirm the Reports group renders expanded automatically and "Trial Balance" is marked active, with Masters/Inputs/Registers rendering per their own last state (collapsed, since this is a fresh load).
   - Refresh the page — confirm the same result (Reports expanded, Trial Balance active) persists after reload.

6. **Placeholder pages** (FR-011)
   - Visit any sub-item route not yet given real requirements (e.g. `/masters/vendors`) — confirm it renders a clearly labeled placeholder ("Vendors — coming soon" or equivalent), not a 404 or blank page.
   - Visit `/masters/customers` (the first page the client is revealing) — if its real requirements have landed, it should show real content instead of the placeholder; if not yet implemented, it should still show the placeholder like any other route.

7. **Mobile / responsive behavior** (FR-013)
   - Resize the browser (or use device emulation) to a narrow/mobile width.
   - Confirm the sidebar is hidden by default and a visible hamburger/menu button appears.
   - Tap the hamburger — confirm the full sidebar opens as an off-canvas panel with all groups and accordion behavior intact.
   - Tap a sub-item link — confirm the panel closes automatically and the app navigates to that route.

## Success check

If all seven steps pass, the feature satisfies SC-001 through SC-004 in `spec.md`. Report any deviation against the specific FR/user-story it violates so `tasks.md` can be revisited before merge.
