# Research: Left Sidebar Navigation

**Feature**: 001-sidebar-navigation | **Date**: 2026-07-14

No `NEEDS CLARIFICATION` markers remain in the Technical Context (the frontend stack is constitution-locked: Next.js App Router, TypeScript, Tailwind CSS, Vitest + React Testing Library). This research phase instead resolves the implementation-pattern decisions needed to satisfy the spec's functional requirements within that stack.

## Decision: Persistent sidebar via a shared App Router layout

- **Decision**: Render `<Sidebar />` once, inside a single `app/(dashboard)/layout.tsx` route-group layout that wraps every Masters/Inputs/Registers/Reports route.
- **Rationale**: Next.js App Router layouts persist across client-side navigations between routes that share them — this is the only way to keep the sidebar's expand/collapse state (FR-012, FR-014) alive as the user moves between sub-item pages, without lifting state into a global store. A route group `(dashboard)` keeps the URL clean (no `/dashboard/` segment in the path) while scoping the layout to only the routes that need the sidebar.
- **Alternatives considered**: Re-rendering the sidebar independently inside every page (rejected — loses expand/collapse state on every navigation, contradicting FR-014); a global client-side state store (e.g. Context/Zustand) shared outside the layout tree (rejected as unnecessary complexity — a shared layout already solves state persistence without extra dependencies).

## Decision: Static navigation config, not fetched data

- **Decision**: Represent the four groups and their sub-items as a single static TypeScript module (`nav-config.ts`) — an array of `{ label, href, order }` per group, each with an ordered array of sub-items.
- **Rationale**: The spec's Assumptions state the four groups and their sub-item lists are fixed for this iteration with no admin UI for editing them; there is no backend or database in scope for this feature (Technical Context: Storage = N/A). A static config is the smallest viable representation and gives compile-time type safety for route generation and tests.
- **Alternatives considered**: Fetching nav structure from an API (rejected — no backend touches this feature; would introduce an unjustified dependency and loading state not called for by any requirement).

## Decision: Route namespacing scheme for Inputs vs. Registers

- **Decision**: `/inputs/<slug>` and `/registers/<slug>` for the six shared labels (e.g. `/inputs/sales` vs. `/registers/sales`); `/masters/<slug>` and `/reports/<slug>` for the other two groups. Slugs are kebab-case (`petty-cash`, `chart-of-accounts`, `trial-balance`, `profit-loss`, `balance-sheet`).
- **Rationale**: Directly satisfies FR-008's namespacing requirement using the parent group as the URL prefix — the simplest scheme that guarantees no collision, and it reads naturally (`/inputs/sales` = "enter a sale", `/registers/sales` = "view sales log") matching the spec's own framing of Inputs vs. Registers.
- **Alternatives considered**: A single flat route per label with a query param or suffix to disambiguate (e.g. `/sales?mode=input`) — rejected as it defeats FR-008's intent of distinct, non-colliding pages and is worse for bookmarking/sharing links to a specific page.

## Decision: One real route file per sub-item, not a catch-all dynamic route

- **Decision**: Each of the 20 sub-items gets its own `page.tsx` under its own folder (e.g. `app/(dashboard)/inputs/sales/page.tsx`), each currently rendering the same shared `<PlaceholderPage title="..." />` component, rather than a single `app/(dashboard)/[group]/[item]/page.tsx` catch-all.
- **Rationale**: The client is revealing each page's real requirements one at a time, starting with Customers. Explicit per-route files mean that when a page's real requirements land, only that one file is touched — no risk of a shared dynamic handler accumulating growing conditional logic per page, and no risk of accidentally affecting an unrelated route's rendering.
- **Alternatives considered**: A single catch-all `[group]/[item]/page.tsx` reading from `nav-config.ts` (rejected — cheaper to write now, but every future single-page reveal would require carving that page back out of a shared file, which is more churn than starting with 20 separate thin files).

## Decision: Active-route detection

- **Decision**: Use the App Router's `usePathname()` client hook inside `NavItem` to compare the current pathname against each item's `href`; the `Sidebar`/`NavGroup` tree is therefore a Client Component (`"use client"`).
- **Rationale**: `usePathname()` is the standard, framework-native way to read the current route on the client, needed for both active-highlighting (FR-009) and deep-link auto-expand (FR-010, FR-014). Placeholder pages themselves can remain Server Components; only the sidebar subtree needs to be a Client Component.
- **Alternatives considered**: Server-side active-state via passing the current path down from a Server Component layout (rejected — the sidebar also needs interactive client state for expand/collapse and the mobile toggle, so it must be a Client Component regardless; deriving active-state from the same client-side hook keeps the logic in one place).

## Decision: Mobile/responsive behavior — off-canvas panel

- **Decision**: Below a Tailwind breakpoint (`md:`), the sidebar renders as a fixed off-canvas panel hidden by default (`-translate-x-full`), toggled via a visible hamburger button that lives in a small top bar; opening sets a client `isOpen` state that also renders a backdrop, and navigating to any sub-item (or clicking the backdrop) closes it. At `md:` and above, the sidebar renders inline/permanently visible with no toggle.
- **Rationale**: Directly matches FR-013 as clarified with the user ("responsive for all screens" → off-canvas + hamburger toggle). Tailwind's responsive utility classes handle the breakpoint switch without extra JS for the desktop case; only the mobile open/close state needs React state.
- **Alternatives considered**: A single fixed-width sidebar with horizontal scroll on mobile (rejected — explicitly ruled out by the clarification answer); a third-party sidebar/drawer library (rejected — the interaction is simple enough that Tailwind + local state avoids an extra dependency).

## Decision: No API contracts generated for this feature

- **Decision**: The `contracts/` directory is created but intentionally left without OpenAPI/GraphQL contract files.
- **Rationale**: Per the Technical Context, this feature has no backend/API surface — every functional requirement is satisfied by client-side routing, static config, and CSS/state, with zero network calls. The plan template's Phase 1 contract-generation step applies "for each user action → endpoint"; this feature has user actions (click, expand, navigate) but none of them cross a network boundary, so there are no endpoints to contract against.
- **Alternatives considered**: Writing a placeholder/empty OpenAPI spec (rejected — would misrepresent the feature as having an API surface it doesn't have, and the constitution's contract-test requirement only applies "any change to an API endpoint's request/response shape," which doesn't occur here).

## Decision: Accessibility pattern for the accordion groups

- **Decision**: Each group header is a `<button>` with `aria-expanded={isOpen}` and `aria-controls` pointing to its sub-item list's `id`; the sub-item list is a `<ul>` with role left as the default (native list semantics), conditionally rendered (or `hidden` attribute) based on `isOpen`.
- **Rationale**: This is the standard accessible disclosure-widget pattern (WAI-ARIA Disclosure) and costs nothing extra beyond the state already required for FR-002/FR-012 — it's a straightforward addition, not a scope expansion, and avoids shipping an inaccessible custom widget by default.
- **Alternatives considered**: A non-semantic `<div onClick>` header with no ARIA attributes (rejected — trivial to avoid the accessibility gap at no extra cost, so there's no reason to accept it).

## Open item carried to spec (not a research question)

- `TODO(NAV_ROLE_SCOPE)` (see spec.md FR-015): exact role scoping among admin/accountant/subscriber is pending client input. This is a product decision, not a technical unknown, so it is tracked in the spec rather than resolved here. The frontend auth-gating mechanism itself (how "authenticated session required" is enforced) is out of scope for this feature and belongs to whichever feature first introduces authentication (per the constitution's own `TODO(AUTH_LIBRARY)` deferral) — this feature only assumes that gate will exist and does not implement it.
