# ADR 2026-11 — CentroListo template skins

## Context
CentroListo free sites use 10 generic templates. Each template is a separate `site_themes` row (`generic-<kind>`). Owner text uses keys that contain the kind. Photos are keyed by `theme_id`. A template change points `brand_theme_slug` to another row. The owner loses text, photos, and colors. List content (team, schedule, FAQ) is fixed in the dictionaries.

## Decision
- One canonical content model for all 10 kinds, stored in `site_themes.skin_content` (JSONB, versioned `v: 1`).
- A skin change updates only `site_themes.template_kind` on the row that `brand_theme_slug` points to.
- Resolution: owner value if set, else the active skin default from the dictionaries.
- Legacy owner text is read through a pure mapper. No SQL backfill.
- Write access: CentroListo staff (`platform_staff`) for any site; the owner for their own site (`platform_tenant_owners`). Checked with `resolvePulsarSiteActor`.
- Audit rows in `platform_audit_log`: `tenant.skin_change`, `tenant.skin_content_save`, `tenant.skin_palette_save`.

## Options considered
- Store lists inside `site_themes.content`. Rejected: `content` is `section → key → LocalizedCopy` and is cleaned for institute templates too.
- Copy text and media to the new `generic-<kind>` row on a switch. Rejected: two sources of truth, media copy in Storage, partial-failure risk.
- SQL backfill of legacy keys. Rejected: a read-time mapper has the same effect, no data risk, and Vitest coverage.

## Consequences
- Tests: schema, mapper, resolver, palette swap, actions (authz, validation, audit).
- The `generic-<kind>` slug of a row no longer tells the active skin. Read `template_kind`.
- Finer staff roles are a later change.
