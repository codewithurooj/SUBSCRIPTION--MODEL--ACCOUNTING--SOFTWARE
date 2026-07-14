# Data Model: Left Sidebar Navigation

**Feature**: 001-sidebar-navigation | **Date**: 2026-07-14

There is no database or persisted storage in this feature (see `research.md` — Storage: N/A). The two entities identified in `spec.md`'s Key Entities section are realized purely as static, in-code TypeScript structures that drive rendering and routing. This document is the authoritative enumeration referenced by `plan.md`'s Project Structure.

## Entity: NavigationGroup

Represents one of the four fixed top-level sidebar sections.

| Field | Type | Notes |
|---|---|---|
| `label` | `string` | Display text; one of `"Masters"`, `"Inputs"`, `"Registers"`, `"Reports"` |
| `slug` | `string` | URL path segment for this group; one of `masters`, `inputs`, `registers`, `reports` |
| `order` | `number` | Fixed display order (0–3), per FR-001 |
| `items` | `NavigationItem[]` | Ordered sub-items belonging to this group |

**Validation rules**:
- Exactly 4 groups exist; `order` values are unique and match the sequence Masters(0), Inputs(1), Registers(2), Reports(3) (FR-001).
- `slug` values are unique across all groups (used as the first URL segment).

**State (client-only, not persisted)**: `isExpanded: boolean` — held in the `Sidebar` component's React state, one entry per group `slug`; not part of the static config itself. Defaults per FR-014: `false` for all groups, except a group is initialized to `true` if the current pathname matches one of its items' `href` (FR-010).

## Entity: NavigationItem

Represents one sub-item link belonging to exactly one `NavigationGroup`.

| Field | Type | Notes |
|---|---|---|
| `label` | `string` | Display text, e.g. `"Sales"`, `"Chart of Accounts"` |
| `slug` | `string` | Kebab-case URL segment, e.g. `sales`, `chart-of-accounts`, `petty-cash`, `profit-loss`, `balance-sheet` |
| `href` | `string` | Full route: `` `/${group.slug}/${item.slug}` `` — globally unique even when `label`/`slug` repeats across groups (FR-008) |
| `order` | `number` | Display order within its parent group |

**Validation rules**:
- `href` MUST be unique across the entire navigation config (enforced by a unit test over `nav-config.ts`, not a runtime check, since the config is static and reviewed at code-change time).
- Two items may share the same `label`/`slug` only if they belong to different groups (this is the expected Inputs/Registers case); the resulting `href`s must still be unique per the rule above.

## Full enumeration (source of truth for route/file generation)

| Group (slug) | Order | Item (slug) | Order | Route |
|---|---|---|---|---|
| Masters (`masters`) | 0 | Customers (`customers`) | 0 | `/masters/customers` |
| Masters (`masters`) | 0 | Vendors (`vendors`) | 1 | `/masters/vendors` |
| Masters (`masters`) | 0 | Chart of Accounts (`chart-of-accounts`) | 2 | `/masters/chart-of-accounts` |
| Inputs (`inputs`) | 1 | Sales (`sales`) | 0 | `/inputs/sales` |
| Inputs (`inputs`) | 1 | Purchase (`purchase`) | 1 | `/inputs/purchase` |
| Inputs (`inputs`) | 1 | Receipt (`receipt`) | 2 | `/inputs/receipt` |
| Inputs (`inputs`) | 1 | Payment (`payment`) | 3 | `/inputs/payment` |
| Inputs (`inputs`) | 1 | Petty Cash (`petty-cash`) | 4 | `/inputs/petty-cash` |
| Inputs (`inputs`) | 1 | Journal (`journal`) | 5 | `/inputs/journal` |
| Registers (`registers`) | 2 | Sales (`sales`) | 0 | `/registers/sales` |
| Registers (`registers`) | 2 | Purchase (`purchase`) | 1 | `/registers/purchase` |
| Registers (`registers`) | 2 | Receipt (`receipt`) | 2 | `/registers/receipt` |
| Registers (`registers`) | 2 | Payment (`payment`) | 3 | `/registers/payment` |
| Registers (`registers`) | 2 | Petty Cash (`petty-cash`) | 4 | `/registers/petty-cash` |
| Registers (`registers`) | 2 | Journal (`journal`) | 5 | `/registers/journal` |
| Reports (`reports`) | 3 | Ledger (`ledger`) | 0 | `/reports/ledger` |
| Reports (`reports`) | 3 | Ageing (`ageing`) | 1 | `/reports/ageing` |
| Reports (`reports`) | 3 | Trial Balance (`trial-balance`) | 2 | `/reports/trial-balance` |
| Reports (`reports`) | 3 | Profit & Loss (`profit-loss`) | 3 | `/reports/profit-loss` |
| Reports (`reports`) | 3 | Balance Sheet (`balance-sheet`) | 4 | `/reports/balance-sheet` |

20 rows total, confirming SC-002's "20 defined sub-items" and matching the file tree in `plan.md`. The `/inputs/sales` and `/registers/sales` rows (and the other five shared labels) demonstrate FR-008's namespacing: identical labels, distinct routes.

## Relationships

- `NavigationGroup 1 ── * NavigationItem` (one group has many items; one item belongs to exactly one group).
- No relationship to any persisted domain entity (Customer, Vendor, Sale, etc.) — this feature only defines the navigation shell and placeholder targets; those domain entities will be introduced by later features per the client's phased reveal.

## State transitions

None beyond the client-only `isExpanded` toggle described above (boolean flip on header click) and the mobile panel's `isOpen` boolean (toggle on hamburger click, forced `false` on navigation). No entity has a persisted lifecycle in this feature.
