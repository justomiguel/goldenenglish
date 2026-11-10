# Phase 3 — Theme document lifecycle

**Status:** draft, waiting for approval.
**Umbrella:** `docs/superpowers/specs/2026-11-10-tenant-design-system-design.md`.
**ADR:** `docs/adr/2026-11-tenant-design-system.md`.
**Depends on:** phase 1 (tokens), phase 2 (registry, `resolveSection`).

## Understanding

- Each tenant stores its design as a theme document: tokens, fonts, sections, and field locks.
- A tenant edits a draft. Publish creates an immutable snapshot. Rollback publishes a copy of an older snapshot.
- Only the published snapshot reaches the public site. A publish in tenant A changes only tenant A.
- CentroListo staff and the institute admin both edit the draft. The admin can change only fields with `editableBy: "admin"`.

## Current state (checked 2026-11-10)

1. `public.site_themes` (migration `047_site_themes.sql`) holds `properties`, `content`, `skin_content`, `blocks`, `template_kind`, and `is_active` per row. Edits write the live row. There is no draft and no history.
2. `loadActiveTheme` (`src/lib/theme/loadActiveTheme.ts`) reads the active row with `unstable_cache` and the tag `siteThemeActiveCacheTagForTenant(slug)`.
3. Staff edit a tenant theme in `src/app/[locale]/admin/tenants/[slug]/theme/` through `loadPulsarThemeEditor`. Institute admins edit in `src/app/[locale]/dashboard/admin/cms/`.
4. Revalidation helpers live in `src/app/[locale]/dashboard/admin/cms/siteThemeActionShared.ts`.

## Decision

### 1. Contract

```ts
type ThemeDocumentV1 = {
  contractVersion: 1;
  tokens: DesignTokensV1;
  fontIds: { heading: FontId; body: FontId };
  sections: ReadonlyArray<{ id: string; variantId: string; major: number; props: unknown }>;
  pages: Readonly<Partial<Record<ThemePageId, { sections: ReadonlyArray<ThemeSection> }>>>;
  editableBy: Readonly<Record<string, "staff" | "admin">>;
};
```

- `sections` is the home page. `pages` holds the other public pages (`register`, `contact`, `blog`, `privacy`, `answers`, `events`, `findClass`). A missing page uses the shared default sections for that page.
- `editableBy` keys are paths: `tokens.color.primary`, `fontIds.heading`, `sections.<id>.props.<field>`, `sections.<id>.variant`, `sections.order`. A missing key means `staff`.
- Zod schema `themeDocumentV1Schema` in `src/lib/theme-document/`. Pure module.

### 2. Tables (tenant schema, migration in `supabase/migrations/`)

`public.theme_documents`

| Column | Type | Note |
|---|---|---|
| `id` | uuid pk | |
| `site_theme_id` | uuid fk `site_themes.id` | |
| `status` | text check `draft`, `published`, `superseded` | |
| `version` | int | Increments per publish for that theme. |
| `document` | jsonb | `ThemeDocumentV1`. |
| `document_hash` | text | sha256 of the canonical JSON. |
| `based_on_id` | uuid null | Source snapshot for a rollback. |
| `created_by`, `created_at`, `published_by`, `published_at` | | |

- Unique partial index: one `draft` per `site_theme_id`. One `published` per `site_theme_id`.
- A trigger rejects `UPDATE` of `document` on `published` and `superseded` rows.
- `site_themes` gains `published_document_id uuid null`. Nothing is dropped (rule 21).
- `masterdb.sql` is updated. Apply with `npm run sql:apply-migration:all-tenants:pg`.

RLS:

- `anon`: no direct access. The public read goes through `get_published_theme_document(p_site_theme_id)`, `security definer`, returning only the published `document`.
- `authenticated` admin (`profiles.role = admin`): read all rows, insert and update the draft.
- Publish and rollback run in RPCs (`publish_theme_document`, `rollback_theme_document`). Each checks the admin role and runs in one transaction.

### 3. Server actions

In `src/app/[locale]/dashboard/admin/cms/themeDocumentActions.ts`. The staff panel calls the same orchestration through `src/lib/theme-document/server/` with the tenant client from the Pulsar flow.

| Action | Effect |
|---|---|
| `saveThemeDraft({ siteThemeId, document, baseHash })` | Validates the schema, checks locks for the actor, checks `baseHash`, writes the draft. |
| `publishThemeDraft({ siteThemeId })` | Runs publish validation, calls the RPC, revalidates the tenant tag, writes pins, audits. |
| `rollbackTheme({ siteThemeId, snapshotId })` | Copies the snapshot into a new published version, revalidates, audits. |
| `discardThemeDraft({ siteThemeId })` | Deletes only the draft row. |

### 4. Field locks

- Pure function `findLockedFieldEdits(prev, next, editableBy, actorRole)` returns the changed paths that the actor cannot edit.
- Staff can edit every path and change `editableBy`. An admin cannot change `editableBy`.
- A locked edit fails with `field_locked` and the path.

### 5. Publish validation

Pure `validateThemeDocument(doc, tenantSlug)`:

- `validateDesignTokens` from phase 1 (`contrast_below_aa`, `token_invalid_color`, `token_invalid_value`, `font_not_in_catalog`).
- `resolveSection` from phase 2 for every section (`variant_version_missing`, `variant_not_available`, `variant_props_invalid`).
- `token_missing` for an empty required token.

Lifecycle codes:

| Code | Cause |
|---|---|
| `document_stale` | `baseHash` does not match the current draft. Another person saved first. |
| `draft_missing` | Publish ran with no draft. |
| `snapshot_not_found` | The rollback snapshot does not exist for that theme. |
| `field_locked` | The admin edited a staff-only path. |

Each code has its own sentence in `en.json`, `es.json`, and `pt.json`. The action returns `{ ok: false, code, path? }`. The server logs `[ge:server]` with scope `themeDocument.save`, `themeDocument.publish`, or `themeDocument.rollback`.

### 6. Read path and cache

- `loadPublishedThemeDocument(tenantSlug)` uses `unstable_cache` with the existing tenant tag.
- Publish and rollback call `revalidateTag(siteThemeActiveCacheTagForTenant(slug))` and the paths for that tenant. The client calls `router.refresh()` (rule 27).
- No published document yet: `legacyThemeToDocument(row)` builds a document in memory from `properties`, `skin_content`, and `template_kind`. The public site keeps working for every tenant before migration.

### 7. Fleet pins (control plane)

- Pulsar migration `supabase/pulsar-migrations/<n>_platform_tenant_variant_pins.sql`: `(tenant_slug, variant_id, major, published_at)`, primary key `(tenant_slug, variant_id, major)`.
- Publish replaces the rows for that tenant. A pin write failure does not undo the publish. It logs `themeDocument.pins` with code `pins_write_failed`.
- `scripts/report-variant-fleet.mjs` reads this table.

### 8. Audit and analytics

- `recordSystemAudit` on publish, rollback, and discard: `resource_type: "theme_document"`, `resource_id` = document id, payload `{ version, documentHash, changedPaths: count }`.
- No `user_events` row. This is a staff action (rule 08).

## Options considered

| Option | Why rejected |
|---|---|
| Keep editing the live row, add an audit log | No preview of unpublished work, no rollback. |
| Store history in Pulsar for all tenants | Mixes tenant data into the control plane. Tenant isolation is weaker. |
| Event sourcing of every field change | Heavy for the need. Snapshots per publish give rollback and audit. |
| Locks enforced only in the UI | An admin could call the action directly. The server must check. |
| Lock by RLS column policies | JSON paths do not map to column policies. |

## Surfaces (Web vs PWA)

- **Public site (Tier A):** reads the published document. Web and PWA trees get the same document. No visual change in this phase.
- **Editors (Tier B):** this phase adds actions and data only. Phase 6 adds UI. Existing editors keep writing the legacy columns until phase 6 switches them.

## Plan outline

1. TDD `themeDocumentV1Schema`, `findLockedFieldEdits`, `validateThemeDocument`, `legacyThemeToDocument`.
2. Tenant migration with tables, trigger, RPCs, RLS. Pulsar migration for pins.
3. Server actions and the shared orchestration for the staff panel.
4. Read path with fallback. Cache revalidation.
5. Audit, logs, dictionary sentences.

## Risks and mitigation

| Risk | Mitigation |
|---|---|
| Fallback and document render differently | Test: `legacyThemeToDocument` on each kind renders the same section list as today. |
| Two editors overwrite each other | `baseHash` check returns `document_stale`. |
| Large documents | Zod caps per field (reuse `MAX_SKIN_TEXT`, `MAX_SKIN_LONG_TEXT`) and a 256 KB document cap (`document_too_large`). |
| Shared-schema tenants | Product SQL qualifies `public.` (rule 45). The apply command rewrites for `tenant_<slug>`. |

## Definition of done

- Schema, lock, validation, and fallback functions have unit tests, including one code per class and the unknown-code path in the UI mapper.
- Migrations applied to all tenants. RLS tests: anon cannot read drafts, an admin cannot update a published row.
- Publish in tenant A does not change tenant B (integration test with two tenant clients).
- Audit rows and logs exist for publish and rollback.

## Out of scope

- Editor UI (phase 6).
- Migrating bespoke tenants (phase 4).

## Manual QA (user)

- None visible in this phase. The public site must look the same on all tenants.
