# ADR — Matiss Studio exclusive theme on the shared CentroListo database

Date: 2026-11-09

## Context

Matiss Studio is a new institute. It runs as a CentroListo subdomain (`matiss.<apex>`) on the shared database, schema `tenant_matiss`. It needs a bespoke landing that only that institute can select.

Shared-schema institutes resolve their theme by `platform_tenants.brand_theme_slug` (`loadActiveTheme` reads that slug from the institute schema). The staff form offers only `generic-*` slugs. Generic theme rows exist in every schema because migration `233_generic_institute_theme_seeds.sql` is product SQL and runs on shared targets. A brand-data file (name contains a brand slug plus `seed`) is skipped on shared targets, so the Liora seed pattern would never reach `tenant_matiss`.

## Decision

1. Add enum value `matiss` and one inactive `site_themes` row in a product migration. It runs on every institute, like the generic seeds.
2. Register the owner as `matiss: ["matiss"]` in `EXCLUSIVE_THEME_OWNERS`. Do not add it to `GENERIC_INSTITUTE_KINDS` or the CentroListo catalog.
3. Let the staff tenant form offer an exclusive slug only when the tenant slug owns that kind. Saving `matiss` with `brandThemeSlug = "matiss"` activates that row inside `tenant_matiss` only.
4. Keep brand facts (name, palette, logo, contact, Instagram) in the theme row properties.

## Options considered

- Seed the row from the staff save action with SQL. Rejected: it duplicates the migration path that already seeds generic themes, and a later schema rebuild would lose the row.
- Name the file `site_theme_matiss_seed.sql`. Rejected: `isBrandDataMigration` skips that name on shared schemas, which is the only place Matiss lives.

## Consequences

- Every institute schema gains one inactive row. The picker hides it unless the tenant slug is `matiss` (`canTenantUseThemeKind`).
- The staff form and `savePulsarTenantAction` gain a branch for exclusive slugs. Tests lock that a generic tenant cannot pick it and that saving `matiss` activates the row.
- Activation writes `is_active` in one schema. It reuses `activateFreeSiteTheme`.
- Landing, `/register`, dictionaries, and assets ship with the enum (rule 28, rule 51).
