# Staff Mutation Audit Events

## Context

Academic, section, finance, and identity mutations need an immutable trail that records who changed what, the relevant values, and a short operational context. The project already has `user_events` for product analytics and `system_config_audit` for admin-only audit rows, but the new requirement also covers teachers and needs structured filters for an admin audit screen.

## Decision

Add `public.audit_events` as the canonical staff mutation audit table and keep `user_events` for product activity analytics. Server actions write audit rows through `src/lib/audit/`, with admin-only reads and append-only writes from trusted server code.

Audit rows store full business values, including finance amounts, in `before_values`, `after_values`, `diff`, and `metadata`. Technical secrets such as passwords, tokens, authorization headers, service keys, and signed URLs are stripped before persistence.

## Options Considered

- Extend `system_config_audit`: smaller migration, but the name and current policy are too narrow for teacher and finance mutation history.
- Use only `user_events`: rejected because analytics events are intentionally sanitized and aggregated, not a legal or support-grade mutation trail.

## Consequences

- Admins get a dedicated, paginated audit surface without mixing product analytics with mutation history.
- Teacher-originated mutations can be audited through server-validated service-role writes while preserving the real actor id.
- The table is retained indefinitely, so all readers must use bounded server-side pagination and supporting indexes.
- Existing `recordSystemAudit` call sites can be bridged into `audit_events` while new work should use the domain-specific audit helpers.
