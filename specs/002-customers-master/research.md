# Phase 0 Research: Customers Master

All items below were resolved during planning; no `NEEDS CLARIFICATION` markers remain in the Technical Context.

> **Note (2026-07-14)**: Items #1 and #2 (auth library, session transport) were implemented and then removed at the client's direction — see plan.md's post-implementation amendment. The analysis below is preserved as reference for whichever future feature reintroduces authentication; it does not describe the currently-shipped code.

## 1. Auth library: custom JWT vs. Better Auth

**Decision**: Implement a custom JWT auth flow directly in FastAPI (login endpoint issues a JWT; a `get_current_user` dependency verifies it on every protected route). Next.js's role is limited to storing the backend-issued JWT in an httpOnly cookie and forwarding it — it does not run its own auth provider.

**Rationale**:
- Better Auth is a TypeScript-native library built around JS/TS ORMs (Drizzle, Prisma, Kysely) and a Node/Edge runtime. This project's backend is Python/FastAPI/SQLModel over a single Neon Postgres database (Article VI, Technology Stack). Adopting Better Auth would mean either (a) running it as a second, JS-only auth microservice with its own schema/migrations, which FastAPI would then have to trust via JWKS verification, or (b) bridging it into Python, which Better Auth does not support natively. Either path adds a second moving service/datastore for a single login form and three static roles — disproportionate to the actual need.
- A custom JWT flow keeps identity data (the `users` table) in the same database, same migration system (Alembic), and same deployment (FastAPI/Render) as everything else, satisfying the "smallest viable change" default policy and Article VI's single-settings-module guidance.
- FastAPI + `PyJWT` + `passlib[argon2]` is a well-trodden, small-surface-area pattern (~150 LOC) that's easy to audit — appropriate for a system whose constitution treats security review as non-negotiable.

**Alternatives considered**:
- *Better Auth as a standalone Node auth microservice, FastAPI verifies via JWKS*: rejected — a second running service, second database schema, and cross-language user/session sync for no functional gain at this scale.
- *Better Auth wired only into Next.js, FastAPI trusts Next.js's session unconditionally*: rejected — violates Article V ("every endpoint MUST enforce an explicit authorization check... default-deny"); FastAPI must independently verify identity per request, not delegate trust to the frontend.

## 2. Session transport: stateless JWT in an httpOnly cookie, via a Next.js BFF

**Decision**: FastAPI issues a short-lived JWT (HS256, shared secret) on login. Next.js Route Handlers under `app/api/**` receive it, store it as an httpOnly, Secure, SameSite=Lax cookie, and forward it as an `Authorization: Bearer` header to FastAPI on every subsequent proxied request. The browser never sees the raw token or talks to FastAPI directly.

**Rationale**:
- Next.js 16 renamed `middleware.ts` to `proxy.ts` and its own authentication guide (`node_modules/next/dist/docs/01-app/02-guides/authentication.md`, consulted directly since `frontend/AGENTS.md` warns this Next.js version has training-data-breaking changes) explicitly recommends: stateless JWT sessions via `jose` (Edge-compatible), httpOnly cookies set server-side, a Data Access Layer (`verifySession()`) for secure checks, and `proxy.ts` only for *optimistic* redirects — never as the sole authorization boundary. This plan follows that guidance directly rather than reinventing a pattern.
- Backend (Render) and frontend (Vercel) are different origins. Routing all customer data access through Next.js Route Handlers avoids CORS entirely (browser only ever calls same-origin `/api/*`) and keeps the JWT out of client-side JS reach (XSS mitigation), at the cost of one extra network hop server-side — an acceptable tradeoff at ~5,000-record scale with no stated latency budget tighter than "instant" UX.

**Alternatives considered**:
- *Browser calls FastAPI directly with a cross-site cookie*: rejected — requires `SameSite=None; Secure` cookies and CORS-with-credentials configuration across Vercel/Render domains, materially more fragile and harder to audit than a same-origin BFF.
- *Server Components fetch FastAPI directly, bypassing the BFF for SSR reads*: considered as a possible optimization (saves one hop on initial page load) but rejected for v1 in favor of a single, consistent code path (all customer access through the BFF) — matches "smallest viable change"; can be revisited later without changing the API contract.

## 3. `customer_code` generation under concurrency (FR-005, FR-007)

**Decision**: A dedicated Postgres sequence (`customers_code_seq`), created in the first Alembic migration, backs `customer_code` generation. On create, the service calls `nextval('customers_code_seq')` and formats the result as `CUS` + zero-padded to 4 digits (e.g., `CUS0001`), expanding digit width automatically past `CUS9999` if ever needed.

**Rationale**: Postgres sequences are natively safe under concurrent transactions — two simultaneous `nextval()` calls never return the same value, satisfying FR-007 without explicit locking. This is simpler and faster than a `SELECT MAX(...) + 1` pattern (which requires a table lock or retry-on-conflict loop to avoid races) or an application-level advisory lock.

**Alternatives considered**:
- *`SELECT MAX(id)` + increment*: rejected — classic race condition under concurrent inserts (FR-007's explicit edge case), requires extra locking to fix.
- *UUID or random code*: rejected — spec requires a sequential, human-readable format (`CUS0001`, `CUS0002`, ...), not just uniqueness.

## 4. Currency validation (FR-021)

**Decision**: A curated, extensible list of ISO 4217 currency codes (starting with the currencies relevant to this business's region — AED, USD, EUR, GBP, SAR, and a handful of others) is maintained as a single source of truth: a Python list/`Enum`-backed check in the backend service layer, mirrored as a TypeScript `const` array for the frontend dropdown. The database column remains `VARCHAR(10)` (matching the client-provided schema) rather than a native Postgres `ENUM` type, so the list can be extended by editing application code without a schema migration.

**Rationale**: The client's schema explicitly typed `currency` as `VARCHAR(10)` with examples "AED, USD, etc.", not a fixed enum column — keeping it a validated string preserves that contract while still satisfying FR-021's "reject any value outside the list" requirement at the application layer. A curated regional list (rather than pulling in all ~180 ISO 4217 codes via a dependency) matches the actual business need and avoids showing an unwieldy dropdown.

**Alternatives considered**: A full ISO 4217 library dependency — rejected as unnecessary weight for a curated, regionally-scoped currency set; can be swapped in later without an API contract change since the wire format (a string code) doesn't change.

## 5. Test database strategy

**Decision**: Backend tests run against a real Postgres database (a dedicated test database/Neon branch via `DATABASE_URL_TEST`), not SQLite. Each test runs inside a transaction that's rolled back afterward for isolation; schema is created once per test session via Alembic.

**Rationale**: This feature's correctness hinges on Postgres-specific behavior — `NUMERIC(12,2)` precision (Article III), sequence-based `customer_code` generation (research item 3), and case-insensitive substring search (`ILIKE`, FR-014). SQLite does not faithfully reproduce any of these (different numeric semantics, no sequences, different `LIKE` collation behavior), so testing against it would risk false-positive test passes that don't hold against the real production database. The constitution's "Contract and integration tests... MUST include a contract or integration test, not unit tests alone" for schema-touching changes reinforces testing against the real engine.

**Alternatives considered**: SQLite in-memory for speed — rejected for the fidelity reasons above; the modest scale of this feature doesn't require sacrificing correctness for test speed.

## 6. Password hashing

**Decision**: `passlib` with the `argon2` scheme (`argon2-cffi` backend).

**Rationale**: Argon2id is the current OWASP-recommended default for password hashing (memory-hard, resistant to GPU/ASIC cracking), and avoids bcrypt's 72-byte input truncation footgun. `passlib`'s `CryptContext` API keeps the hashing scheme swappable later without touching call sites.

**Alternatives considered**: bcrypt — a reasonable, widely-used alternative, but Argon2 is the newer OWASP-preferred default with no notable downside for this use case.
