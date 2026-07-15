# Data Model: Customers Master

## Entity: Customer

Maps to the `customers` table. Backs FR-003 through FR-025.

| Field | Type (SQLModel/Postgres) | Required | Constraints / Notes |
|---|---|---|---|
| `id` | `int` / `SERIAL PRIMARY KEY` | yes (system-assigned) | Auto-increment, never client-supplied |
| `customer_code` | `str` / `VARCHAR(20)` | yes (system-assigned) | Server-generated via `customers_code_seq` (research.md #3), format `CUS0001`; unique; immutable after creation (FR-005, FR-006, FR-007) |
| `customer_name` | `str` / `VARCHAR(150)` | yes | No uniqueness constraint (duplicates allowed — Clarifications session) |
| `contact_person` | `str \| None` / `VARCHAR(100)` | no | |
| `mobile` | `str \| None` / `VARCHAR(20)` | no | |
| `phone` | `str \| None` / `VARCHAR(20)` | no | |
| `email` | `str \| None` / `VARCHAR(150)` | no | Validated for well-formed email format when provided (Assumptions); not unique |
| `website` | `str \| None` / `VARCHAR(150)` | no | Validated for well-formed URL format when provided |
| `tax_registration_no` | `str \| None` / `VARCHAR(50)` | no | **Unique when provided** (FR-020); empty/absent values excluded from the uniqueness check (partial unique index) |
| `customer_type` | `str` / `VARCHAR(20)` | yes | Enum: `Individual`, `Company` (FR-008) |
| `opening_balance` | `Decimal` / `NUMERIC(12,2)` | yes | Default `0.00`; MUST be `>= 0` (FR-012); **immutable after creation** (FR-024) |
| `balance_type` | `str` / `VARCHAR(10)` | yes | Enum: `Debit`, `Credit` (FR-009) |
| `credit_limit` | `Decimal \| None` / `NUMERIC(12,2)` | no | MUST be `>= 0` when provided (FR-012); editable after creation |
| `payment_terms` | `int \| None` | no | Non-negative integer (days); no fixed enum (Assumptions) |
| `currency` | `str` / `VARCHAR(10)` | yes | Restricted to the curated ISO 4217 list (research.md #4, FR-021) |
| `status` | `str` / `VARCHAR(10)` | yes | Enum: `Active`, `Inactive`; defaults to `Active` on create if omitted (FR-010) |
| `notes` | `str \| None` / `TEXT` | no | |
| `created_at` | `datetime` / `TIMESTAMP` | yes (system-assigned) | Set once on creation; never modified (FR-022) |
| `updated_at` | `datetime` / `TIMESTAMP` | yes (system-assigned) | Refreshed on every successful edit or status change (FR-017, FR-018) |

### Validation rules (enforced server-side; mirrored client-side per FR-023)

- Required on create: `customer_name`, `customer_type`, `opening_balance`, `balance_type`, `currency`, `status` (defaults to `Active` if `status` omitted — FR-010).
- `customer_type ∈ {Individual, Company}`, `balance_type ∈ {Debit, Credit}`, `status ∈ {Active, Inactive}` — reject otherwise (FR-008–FR-010).
- `opening_balance`, `credit_limit`: non-negative, exactly 2 decimal places, no floating-point coercion (FR-011, FR-012).
- `currency`: must be a member of the curated ISO 4217 list (FR-021).
- `tax_registration_no`: when non-empty, must not match another customer's `tax_registration_no` (FR-020) — enforced via a partial unique index (`WHERE tax_registration_no IS NOT NULL`).
- On edit: `id`, `customer_code`, `opening_balance`, `created_at` are rejected/ignored if present with a different value (FR-006, FR-017, FR-024); `updated_at` is server-set, never client-supplied.

### State transitions

```
        create
          │
          ▼
      [Active]  <──────┐
          │             │  reactivate (FR-018)
          │ deactivate  │
          ▼             │
      [Inactive] ───────┘
```

- No transition to a "deleted" state exists — FR-019 guarantees no hard-delete path anywhere.
- All other fields are unaffected by a status transition (FR-018 acceptance scenarios).

### Concurrency

- Last-write-wins on concurrent edits (FR-025) — no version/optimistic-lock column. The `UPDATE ... SET ... WHERE id = :id` statement from whichever request completes last simply persists.

## Entity: User — REMOVED (2026-07-14)

This feature originally included an auth-only `User` entity (see plan.md's post-implementation amendment). It was deleted, along with the `users` table and all auth code, at the client's direction — they are directing feature work incrementally and had not requested authentication. Revisit if/when the client asks for an authentication feature.

## Relationships

- `Customer` has no foreign keys to other domain tables in this feature — it is pure master data.
- Future features (Sales, Purchase, etc., explicitly out of scope here) are expected to reference `Customer` by `id` (and/or display `customer_code`); this data model's shape is treated as a stable contract per the spec's Key Entities note.
