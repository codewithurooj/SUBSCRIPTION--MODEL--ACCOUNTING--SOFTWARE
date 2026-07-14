# Feature Specification: Left Sidebar Navigation

**Feature Branch**: `001-sidebar-navigation`
**Created**: 2026-07-14
**Status**: Draft
**Input**: User description: "navbar (left sidebar navigation) for the subscription accounting software. Build a left sidebar navigation with 4 top-level expandable/collapsible groups (Masters, Inputs, Registers, Reports), each with defined sub-items. Groups are accordion-style collapsible; Inputs and Registers share identically-named sub-items but must route to distinct namespaced pages; active route must be highlighted; sub-item links route to placeholder pages only — this feature is the navbar/routing shell, not the page content."

## Clarifications

### Session 2026-07-14

- Q: On narrow/mobile viewports, what should the sidebar do? → A: Off-canvas panel hidden by default, opened via a visible menu/hamburger toggle; full labels and accordion groups shown when open, closes after navigating.
- Q: When one group is expanded, should other expanded groups stay open, or does expanding one auto-collapse the others? → A: Independent toggles — multiple groups may be expanded at the same time; expanding one group never collapses another.
- Q: On first load, with no active route to auto-expand, what should the sidebar's initial expand state be? → A: All four groups render collapsed by default.
- Q: Which roles (admin, accountant, subscriber) may see and use this sidebar, per Article V's pre-plan role declaration requirement? → A: Not yet specified by the client. Resolved as: authentication is still required (default-deny for unauthenticated users), but role-level scoping among admin/accountant/subscriber is deferred — tracked as TODO(NAV_ROLE_SCOPE) in FR-015, to be narrowed once the client specifies it.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse and open a section via the sidebar (Priority: P1)

As a user of the accounting software, I want a left sidebar that lists the four main areas of the system (Masters, Inputs, Registers, Reports) so that I can expand any area and open one of its pages.

**Why this priority**: This is the core value of the feature — without it, there is no navigation shell for any other page in the product to be built against. Every other capability (namespacing, active-state highlighting, deep linking) is meaningless without this baseline.

**Independent Test**: Load the application, confirm all four groups appear in the specified order, click each group header to expand it, and confirm the correct sub-items appear as links in the correct order. Can be fully tested with no other feature present.

**Acceptance Scenarios**:

1. **Given** the application has loaded, **When** the user views the sidebar, **Then** four group headers are visible in this exact order: Masters, Inputs, Registers, Reports.
2. **Given** a group is collapsed, **When** the user clicks its header, **Then** the group expands and reveals its sub-items as links, in the order specified for that group.
3. **Given** a group is expanded, **When** the user clicks its header again, **Then** the group collapses and hides its sub-items.
4. **Given** the sidebar is visible, **When** the user clicks a sub-item link, **Then** the application navigates to that sub-item's placeholder page.

---

### User Story 2 - Distinguish identically-named Inputs and Registers pages (Priority: P2)

As a user, I want the "Sales" (and other identically-named) links under Inputs to take me somewhere different than the "Sales" link under Registers, so that I never lose track of whether I'm entering a new transaction or viewing a log of existing ones.

**Why this priority**: Inputs and Registers share six identical sub-item labels (Sales, Purchase, Receipt, Payment, Petty Cash, Journal). Without correct namespacing this is a direct collision risk that would silently send users to the wrong page or overwrite one page's route with another's — a correctness issue, not just a nice-to-have.

**Independent Test**: From a fully collapsed sidebar, expand Inputs and click "Sales"; confirm the resulting page/route is distinct from the page/route reached by expanding Registers and clicking "Sales". Repeat for all six shared labels.

**Acceptance Scenarios**:

1. **Given** the sidebar is expanded, **When** the user clicks "Sales" under Inputs, **Then** the resulting route is distinct from the route reached by clicking "Sales" under Registers.
2. **Given** the user is on the Inputs > Sales placeholder page, **When** the user inspects the sidebar, **Then** only the Inputs > Sales entry is highlighted as active (not Registers > Sales).
3. **Given** all six shared sub-item labels (Sales, Purchase, Receipt, Payment, Petty Cash, Journal) exist under both Inputs and Registers, **When** each is visited, **Then** each of the 12 resulting pages is independently reachable and distinguishable.

---

### User Story 3 - Know where you are in the app (Priority: P3)

As a user, I want the sidebar to highlight my current page so that I always know which section and sub-item I'm viewing, even after a page refresh or a direct link.

**Why this priority**: Orientation matters once there are 20+ destination pages behind four groups, but the navigation shell is usable without it (a user can still get to every page). It builds on User Story 1 and depends on the routing structure it establishes.

**Independent Test**: Navigate to any sub-item page (including via a direct URL / refresh, not just a sidebar click), and confirm the sidebar shows the correct group expanded and the correct sub-item visually marked as active, with no other sub-item marked active.

**Acceptance Scenarios**:

1. **Given** the user navigates to a sub-item page by clicking its sidebar link, **Then** that sub-item is visually marked as the active item and no other sub-item is marked active.
2. **Given** the user loads a sub-item's URL directly (e.g., via refresh or a bookmarked link), **Then** the sidebar renders with that sub-item's parent group already expanded and that sub-item marked active.
3. **Given** the user is on a page outside the four defined groups (e.g., an app home page), **Then** no sidebar sub-item is marked active.

---

### Edge Cases

- What happens when a user visits a route that doesn't correspond to any sidebar sub-item? Sidebar should render with no active highlight rather than erroring.
- What happens if a placeholder page for a sub-item that hasn't been "revealed" yet (per the client's phased rollout) is visited before its real requirements exist? It must still render a clearly labeled placeholder, not a broken page or 404.
- How does the sidebar behave if a group's sub-item list changes later (e.g., an item added to Reports)? Adding/removing sub-items in one group must not affect the routes or active-state behavior of sub-items in other groups.
- Since multiple groups can be expanded at once (FR-012), when the user is on a sub-item belonging to only one of them, only that one sub-item is marked active; any other expanded group shows no active item.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a persistent left sidebar containing exactly four top-level navigation groups, in this fixed order: Masters, Inputs, Registers, Reports.
- **FR-002**: Each top-level group MUST be independently collapsible/expandable; clicking a group's header toggles that group's sub-items between visible and hidden.
- **FR-003**: The Masters group MUST contain these sub-items, in this order: Customers, Vendors, Chart of Accounts.
- **FR-004**: The Inputs group MUST contain these sub-items, in this order: Sales, Purchase, Receipt, Payment, Petty Cash, Journal.
- **FR-005**: The Registers group MUST contain these sub-items, in this order: Sales, Purchase, Receipt, Payment, Petty Cash, Journal.
- **FR-006**: The Reports group MUST contain these sub-items, in this order: Ledger, Ageing, Trial Balance, Profit & Loss, Balance Sheet.
- **FR-007**: Each sub-item MUST render as a clickable link that navigates to a page dedicated to that sub-item.
- **FR-008**: Sub-item routes belonging to Inputs and Registers MUST be namespaced by their parent group so that identically-labeled sub-items (Sales, Purchase, Receipt, Payment, Petty Cash, Journal) resolve to distinct, non-colliding pages.
- **FR-009**: System MUST visually highlight the sidebar sub-item (and its parent group) corresponding to the page the user is currently viewing.
- **FR-010**: When a user arrives at a sub-item's page directly (deep link or refresh, not only via sidebar click), the sidebar MUST render with that sub-item's parent group expanded and that sub-item highlighted as active.
- **FR-011**: Every sub-item MUST route to a placeholder page (clearly indicating the page is not yet built) rather than an error or missing-route page, regardless of whether that page's real requirements have been defined yet.
- **FR-012**: Groups MUST expand/collapse independently of one another; multiple groups MAY be expanded at the same time, and expanding or collapsing one group MUST NOT change the expanded/collapsed state of any other group.
- **FR-013**: On narrow/mobile viewports, the sidebar MUST be hidden by default and reachable via a visible menu/hamburger toggle control; opening it MUST reveal the full sidebar (all group labels, sub-items, and accordion behavior unchanged), and it MUST close automatically after the user navigates to a sub-item.
- **FR-014**: On first load with no prior expand/collapse state, all four groups MUST render collapsed by default, except that if the current route matches a sub-item, that sub-item's parent group MUST render expanded instead (per FR-010).
- **FR-015**: The sidebar and every sub-item route it links to MUST require an authenticated session; unauthenticated requests MUST be denied by default (redirected to sign-in) rather than shown any navigation or placeholder content. TODO(NAV_ROLE_SCOPE): which of the constitution's roles (admin, accountant, subscriber) may see this navigation is not yet specified by the client — until specified, all authenticated roles are treated as permitted equally. Revisit and narrow via `/sp.clarify` the moment the client specifies role scope for Masters/Inputs/Registers/Reports.

### Key Entities

- **Navigation Group**: A top-level, named section of the sidebar (Masters, Inputs, Registers, Reports) with a fixed display order and an expanded/collapsed state.
- **Navigation Item**: A single sub-item link belonging to exactly one Navigation Group, with a label, a display order within its group, and a route unique across the whole application (even when its label duplicates another item's label in a different group).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can reach any of the sidebar's sub-item pages in 2 interactions or fewer from any other page in the app (expand group, click sub-item).
- **SC-002**: 100% of the 20 defined sub-items resolve to a unique, distinguishable page — in particular, all 6 shared labels under Inputs and Registers never navigate to the same page as each other.
- **SC-003**: In 100% of navigation events (via sidebar click, direct URL load, or refresh), the sidebar shows exactly one active sub-item that matches the page currently being viewed, with zero mismatches.
- **SC-004**: A new sub-item can be added to any one group without requiring changes to the routes, labels, or active-state behavior of any sub-item in the other three groups.

## Assumptions

- No icons are required for groups or sub-items in this iteration; labels are text-only. Icons can be layered on later without affecting routing or structure.
- "Placeholder page" means a minimal page identifying which section/sub-item it represents and that content is pending — no functional business logic, forms, or data are in scope for this feature.
- The four groups and their sub-item lists are fixed and provided by the client for this iteration; no admin UI for reordering or renaming groups/sub-items is in scope.
- Only one instance of the sidebar is needed application-wide (no per-role or per-tenant variation in this iteration).
