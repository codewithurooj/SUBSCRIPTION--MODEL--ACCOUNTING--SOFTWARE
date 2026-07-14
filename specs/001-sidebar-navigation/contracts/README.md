# Contracts: Left Sidebar Navigation

No API contracts are generated for this feature. Every functional requirement (rendering groups, expand/collapse, route namespacing, active-route highlighting, placeholder pages) is satisfied entirely client-side by Next.js App Router routing, a static navigation config, and component state — there is no network boundary and no backend/API surface introduced or changed by this feature.

See `research.md` → "Decision: No API contracts generated for this feature" for the full rationale. This directory is kept (empty of contract files) so the standard `specs/<feature>/contracts/` location exists for any future feature that does introduce an API surface touching navigation (e.g., role-scoped nav config once `TODO(NAV_ROLE_SCOPE)` in `spec.md` is resolved).
