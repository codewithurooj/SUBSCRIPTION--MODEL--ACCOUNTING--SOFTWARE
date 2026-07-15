# Feature Specification: Customers Master

**Feature Branch**: `002-customers-master`
**Created**: 2026-07-14
**Status**: Draft
**Input**: User description: "full CRUD for the Customers master (Masters → Customers) in the subscription accounting software. Replaces the placeholder page at frontend/app/(dashboard)/masters/customers/page.tsx. Scaffolds backend/ (FastAPI + SQLModel + PostgreSQL/Neon) as the first backend-requiring feature. Data model: id, customer_code (server-generated, e.g. CUS0001), customer_name, contact_person, mobile, phone, email, website, tax_registration_no, customer_type (Individual/Company), opening_balance (decimal), balance_type (Debit/Credit), credit_limit (decimal), payment_terms, currency, status (Active/Inactive), notes, created_at, updated_at. Required: customer_code, customer_name, customer_type, opening_balance, balance_type, currency, status. Full CRUD with soft-delete/status-toggle instead of hard delete; customer_code immutable after creation; this is master data other future features (Sales, Purchase) will reference, so the API contract must stay stable."

## Clarifications

### Session 2026-07-14

- Q: Which authenticated roles (admin, accountant, subscriber) may view versus create/edit/deactivate customer records? → A: Not yet specified by the client. Resolved as: all authenticated roles (admin, accountant, subscriber) are permitted equally for every customer-master action for now — same deferral pattern used in the sidebar-navigation feature — tracked as TODO(CUSTOMERS_ROLE_SCOPE) in FR-002, to be narrowed once the client specifies role rules.
- Q: Should the system enforce uniqueness on any customer-identifying field (e.g., tax_registration_no, customer_name) to prevent duplicate customer records? → A: Enforce uniqueness on tax_registration_no only, when provided. customer_name duplicates are allowed (companies can legitimately share a trade name).
- Q: Should currency be restricted to a fixed list of supported currency codes, or accepted as free text? → A: Restricted to a fixed list of supported ISO 4217 currency codes, presented as a dropdown/select rather than free text.
- Q: Should the customer list support filtering by status? → A: Yes — filterable, showing both Active and Inactive customers by default (matches existing FR-013), with an optional filter to narrow to Active only or Inactive only.
- Q: If two staff members edit the same customer at nearly the same time, how should the conflict be resolved? → A: Last write wins — the most recent save overwrites without a conflict error; no optimistic-locking/versioning is required for v1.
- Q: Should opening_balance remain editable after a customer's initial creation, or become locked like customer_code? → A: Locked after creation — opening_balance is a fixed onboarding snapshot and becomes immutable the moment the customer record is created, same as customer_code.
- Q: What search matching behavior and data scale should the customer list be designed around? → A: Substring (contains) matching across customer_code, customer_name, and contact_person, designed around a typical scale of up to ~5,000 customers — consistent with SC-003.

### Session 2026-07-14 (post-implementation amendment)

- Authentication (FR-001/FR-002 as originally written, plus the JWT/login infrastructure built to satisfy them) has been **removed** at the client's direction: the client is directing feature work incrementally and has not yet asked for authentication on this page. FR-001/FR-002 below are revised accordingly. Authentication will be (re)added as its own explicitly-requested feature when the client asks for it — at that point it should also cover any other pages/features shipped in the meantime, not just this one.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a new customer record (Priority: P1)

As an accounting staff member, I want to add a new customer to the master list with their contact, billing, and currency details, so that the business can start invoicing or tracking transactions against them.

**Why this priority**: Nothing else in this feature — or any future feature that references a customer (Sales, Purchase, invoicing) — is possible until customers can be created. This is the minimum viable slice.

**Independent Test**: From the Customers page, open the "New Customer" form, fill in all required fields, submit, and confirm the customer appears in the list with a server-generated code and Active status. Can be fully tested with no other feature present.

**Acceptance Scenarios**:

1. **Given** the customer creation form, **When** the user fills in all required fields (customer_name, customer_type, opening_balance, balance_type, currency, status) and submits, **Then** a new customer record is created with a server-generated, sequential customer_code and the record appears in the customer list.
2. **Given** the customer creation form, **When** the user omits a required field and submits, **Then** the system rejects the submission and shows a validation error identifying the missing field(s), and no record is created.
3. **Given** a completed customer creation form, **When** the user submits it, **Then** created_at and updated_at are set automatically to the current time without any user input.

---

### User Story 2 - Search and browse the customer list (Priority: P2)

As an accounting staff member, I want to see a searchable, sortable list of all customers, so that I can quickly find a specific customer among many records.

**Why this priority**: Once customers exist, staff need to locate them efficiently for day-to-day work; this is the second most common action after creation and is required before edit/deactivate can be exercised in practice.

**Independent Test**: With multiple customers already created, load the customer list, search by name or code, and sort by any listed column; confirm results match expectations. Depends only on User Story 1 having produced data to browse.

**Acceptance Scenarios**:

1. **Given** the customer list contains more records than fit on one page, **When** the user views the list, **Then** the list is paginated and the user can navigate between pages.
2. **Given** the customer list, **When** the user searches by customer_code, customer_name, or contact_person, **Then** records whose value contains the search text anywhere (not only at the start) are shown.
3. **Given** the customer list, **When** the user sorts by customer_code, customer_name, customer_type, balance_type, or status, **Then** the list re-orders accordingly, ascending or descending.
4. **Given** a search that matches no records, **When** the user views the results, **Then** the list shows a clear empty state rather than an error.
5. **Given** the customer list showing both Active and Inactive customers by default, **When** the user applies the Active-only filter, **Then** Inactive customers are hidden from the list until the filter is cleared or switched to Inactive-only.

---

### User Story 3 - Edit an existing customer's details (Priority: P3)

As an accounting staff member, I want to update a customer's details when their information changes (new contact person, updated credit limit, etc.), so that the master record stays accurate.

**Why this priority**: Builds on Stories 1 and 2 (a customer must exist and be found before it can be edited); important for data accuracy but not required for the initial MVP of onboarding customers.

**Independent Test**: Open an existing customer, change one or more editable fields, save, and confirm the changes persist and updated_at reflects the change, while customer_code, opening_balance, and created_at remain unchanged.

**Acceptance Scenarios**:

1. **Given** an existing customer record, **When** the user edits any field except id, customer_code, opening_balance, and created_at, and saves, **Then** the changes are persisted and updated_at is refreshed to the current time.
2. **Given** an existing customer record open for editing, **When** the user attempts to change the customer_code or opening_balance value, **Then** the system does not apply either change — the original values are retained.
3. **Given** an edit form, **When** the user clears a required field and saves, **Then** the system rejects the submission with a validation error and the previous values remain unchanged.
4. **Given** two staff members open the same customer for editing at the same time, **When** both save changes, **Then** the second save to complete persists as the final state, with no conflict error shown to either user.

---

### User Story 4 - Deactivate or reactivate a customer (Priority: P4)

As an accounting staff member, I want to mark a customer as Inactive instead of deleting them, so that the business stops transacting with them going forward while keeping their full history intact — and I want to reactivate them later if needed.

**Why this priority**: Lower frequency than create/browse/edit, and depends on customers already existing; still required for full CRUD parity and to satisfy the "no hard delete on master accounting data" requirement.

**Independent Test**: Open an Active customer, toggle status to Inactive, confirm it is excluded from any "active only" view but still retrievable/visible in the full list; toggle back to Active and confirm it is fully usable again.

**Acceptance Scenarios**:

1. **Given** an Active customer, **When** a user sets its status to Inactive, **Then** the record's status changes to Inactive and all other fields remain unchanged.
2. **Given** an Inactive customer, **When** a user sets its status back to Active, **Then** the record's status changes to Active and all other fields remain unchanged.
3. **Given** any customer record, **When** a user looks for a way to permanently delete it, **Then** no such action is available anywhere in the system.

---

### Edge Cases

- What happens when two staff members submit "create customer" at nearly the same moment? The system MUST still issue two distinct, sequential customer_codes — never a duplicate.
- What happens when a create or edit request supplies opening_balance or credit_limit with more than 2 decimal places, a negative value, or a non-numeric value? The system MUST reject it with a validation error and MUST NOT store the value.
- What happens when a client attempts to send its own customer_code in a create or edit request? The system MUST ignore or reject the client-supplied value — the code is always server-generated on create and frozen thereafter.
- What happens when a user searches or sorts an empty customer list (no customers created yet)? The system MUST show an empty state, not an error.
- What happens when someone tries to set customer_type, balance_type, or status to a value outside their fixed allowed sets? The system MUST reject the request with a validation error.
- What happens when a create or edit request supplies a tax_registration_no that already belongs to another customer? The system MUST reject it with a validation error identifying the conflict, and MUST NOT create or modify the record.
- What happens when a create or edit request supplies a currency value outside the supported ISO 4217 code list? The system MUST reject it with a validation error.
- What happens when an edit request attempts to change opening_balance after creation? The system MUST reject or ignore that part of the request — the original opening_balance is retained, same as customer_code.
- What happens when two staff members save edits to the same customer at nearly the same time? The system MUST apply last-write-wins — the save that completes last persists as the final state, with no conflict error surfaced to either user.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST NOT require authentication for any customer-master action (viewing the list, viewing a single record, creating, editing, deactivating, reactivating) at this time — removed at the client's direction (see Clarifications, post-implementation amendment). TODO(CUSTOMERS_AUTH): revisit and add authentication as its own explicitly-requested feature once the client asks for it.
- **FR-002**: *(removed — role-based access control is moot while FR-001 requires no authentication; revisit alongside FR-001 when auth is reintroduced)*
- **FR-003**: System MUST allow users to create a new customer record by supplying customer_name, customer_type, opening_balance, balance_type, currency, and status as required fields, plus any of contact_person, mobile, phone, email, website, tax_registration_no, credit_limit, payment_terms, and notes as optional fields.
- **FR-004**: System MUST reject any create or edit request that omits customer_name, customer_type, opening_balance, balance_type, currency, or status, returning a field-specific validation error, without creating or modifying a record.
- **FR-005**: System MUST auto-generate a unique, sequential customer_code (format `CUS` followed by a zero-padded number, e.g. `CUS0001`, `CUS0002`, ...) for every new customer record; the client MUST NOT be able to supply or influence this value.
- **FR-006**: System MUST prevent customer_code from being changed after creation under any edit request.
- **FR-007**: System MUST guarantee customer_code uniqueness even when multiple customers are created concurrently by different users.
- **FR-008**: System MUST restrict customer_type to exactly one of: Individual, Company.
- **FR-009**: System MUST restrict balance_type to exactly one of: Debit, Credit.
- **FR-010**: System MUST restrict status to exactly one of: Active, Inactive, defaulting to Active when a create request does not explicitly set it.
- **FR-011**: System MUST store and return opening_balance and credit_limit as exact decimal values with 2 decimal places, with no floating-point rounding discrepancy between the value a user enters and the value stored or displayed.
- **FR-012**: System MUST reject negative values for opening_balance and credit_limit; the balance's debit/credit direction is expressed separately via balance_type, not by a negative amount.
- **FR-013**: System MUST allow users to browse a paginated list of all customers, showing both Active and Inactive customers by default, with an optional filter to narrow the list to Active-only or Inactive-only.
- **FR-014**: System MUST allow users to search the customer list by customer_code, customer_name, and contact_person, matching any record whose value contains the search text anywhere in the field (substring match), not only values that start with it.
- **FR-015**: System MUST allow users to sort the customer list by customer_code, customer_name, customer_type, balance_type, and status, in ascending or descending order.
- **FR-016**: System MUST allow users to view the full detail of a single customer record.
- **FR-017**: System MUST allow users to edit any field of an existing customer record except id, customer_code, opening_balance, and created_at; updated_at MUST be refreshed automatically on every successful edit.
- **FR-018**: System MUST allow users to deactivate an Active customer (set status to Inactive) and reactivate an Inactive customer (set status to Active) without altering any other field.
- **FR-019**: System MUST NOT provide any means, in the UI or the API, to permanently delete a customer record.
- **FR-020**: System MUST reject a create or edit request whose tax_registration_no matches another existing customer's tax_registration_no (comparison only applies when the field is provided; empty/absent values are not compared for uniqueness).
- **FR-021**: System MUST restrict the currency field to a fixed list of supported ISO 4217 currency codes and reject any value outside that list.
- **FR-022**: System MUST set created_at automatically at the moment a customer record is created and MUST NOT allow it to be modified thereafter.
- **FR-023**: System MUST validate the create/edit form on the client using the same required-field and format rules enforced by the server (FR-004, FR-008–FR-012), surfacing inline errors before submission.
- **FR-024**: System MUST prevent opening_balance from being changed after creation, same as customer_code (FR-006); edit requests that include a different opening_balance value MUST be rejected or that part of the request silently ignored, with the original value retained.
- **FR-025**: System MUST apply last-write-wins semantics when two edits to the same customer record are saved concurrently; no conflict error is surfaced to either user, and no optimistic-locking/version check is required.

### Key Entities

- **Customer**: A person or company the business bills for subscriptions or services. Holds identity fields (customer_code, customer_name, customer_type), contact fields (contact_person, mobile, phone, email, website), financial fields (opening_balance, balance_type, credit_limit, payment_terms, currency, tax_registration_no), lifecycle fields (status, notes, created_at, updated_at), and a numeric id. Referenced by future transactional features (Sales, Purchase, and others) via its id/customer_code; those features are out of scope for this spec but depend on this entity's shape remaining stable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A staff member can create a new, fully valid customer record in under 2 minutes using the form.
- **SC-002**: 100% of customer codes issued are unique and sequential, with zero duplicates, even when customers are created concurrently by multiple staff members.
- **SC-003**: A user can locate a specific customer among at least 5,000 records via search in under 10 seconds.
- **SC-004**: 100% of monetary values entered for opening_balance and credit_limit are stored and redisplayed with no rounding discrepancy from the value entered.
- **SC-005**: Deactivating a customer never removes or alters its historical data — 100% of deactivated customer records remain fully viewable afterward.

## Assumptions

- Pagination page size, exact search/sort UI mechanics, and other presentation details are left to implementation as long as FR-013–FR-015 are satisfied.
- The customer list and its search/pagination are designed around a typical scale of up to ~5,000 customer records (consistent with SC-003); no specialized full-text search infrastructure is required at this scale.
- email and website, when provided, are validated for well-formed format but are not required to be unique.
- payment_terms, when provided, accepts any non-negative whole number of days; no fixed list of allowed terms is required by the client.
- No bulk import/export, document attachments, customer merge/deduplication tooling, or change-history/audit-log UI for customer edits is in scope for this iteration.
- Sales, Purchase, invoicing, and any other feature that will reference a customer are explicitly out of scope here — this spec only covers the Customers master itself.
- No customer self-service/portal access is in scope; this feature is for internal accounting staff only.
- This feature has no authentication or access control (see FR-001, post-implementation amendment). The client is directing work incrementally and will request authentication as its own feature when needed.
