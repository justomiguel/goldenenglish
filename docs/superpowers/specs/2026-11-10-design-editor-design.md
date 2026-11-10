# Phase 6 — Design editor (staff and institute admin)

**Status:** draft, waiting for approval.
**Umbrella:** `docs/superpowers/specs/2026-11-10-tenant-design-system-design.md`.
**ADR:** `docs/adr/2026-11-tenant-design-system.md`.
**Depends on:** phase 3 (theme document actions). Uses phase 1 tokens and phase 2 `editorFields`.

## Understanding

- CentroListo staff build the base site of a tenant: tokens, fonts, sections, variants, and field locks.
- The institute admin edits only the fields that staff marked `editableBy: "admin"`.
- Both edit a draft, see a preview, and publish. Both can roll back.
- The editor replaces the current landing and theme editors once every tenant has a published document.

## Current state (checked 2026-11-10)

1. Staff edit a tenant at `src/app/[locale]/admin/tenants/[slug]/theme/` with `SiteThemeEditorShell`, `GenericSiteColors`, `GenericSiteCopyForm`, `GenericSitePhotos`, `GenericSiteLogo`, and the landing section pages.
2. Institute admins edit at `src/app/[locale]/dashboard/admin/cms/` with `LandingBlocksPanel`, `LandingSectionEditorShell`, `SiteThemeEditorShell`, `SiteThemeRawEditorShell`, and the template picker.
3. Editors write live rows. There is no preview of unpublished work for the public site.
4. Admin tours exist and must stay current (rule 33).

## Decision

### 1. One editor, two roles

- Organism `ThemeDocumentEditor` in `src/components/desktop/organisms/theme-document-editor/`. Tier B, desktop-only.
- Hook `useThemeDocumentEditor` (`src/hooks/`) holds the draft, the `baseHash`, dirty state, validation issues, and the save, publish, discard, and rollback handlers. It calls `router.refresh()` after success (rule 27).
- The staff route mounts it with `actorRole: "staff"`. The CMS route mounts it with `actorRole: "admin"`.
- For an admin, a locked field renders read-only with a lock icon and the sentence "Your platform team controls this field." from the dictionaries. The server still checks locks (phase 3).

### 2. Tabs (`usePersistentPageTab`, key `design`)

| Tab | Content | Staff | Admin |
|---|---|---|---|
| Identity | Palette pairs with live contrast ratio and AA badge, heading and body font selects, radius, density, type scale, motion level | Edit all, set locks | Edit unlocked |
| Pages | Page list (home, register, contact, blog, privacy, answers, events, find class). Per page: ordered sections | Add, remove, reorder, pick variant and major | Reorder and hide only when `sections.order` is unlocked |
| Section | Fields from the variant `editorFields`: localized text (`es`, `en`, `pt`), long text, image slot, list, select, toggle | Edit all, lock per field | Edit unlocked |
| Versions | Published history with version, date, author, and hash. Rollback per row. Pending major upgrades | Full | Rollback only if staff allow it (`editableBy["publish.rollback"]`) |

- Image fields reuse the existing media upload with `InlineUploadProgressBar` (rule 48).
- The variant picker lists `variantsForTenant(slug, slot)` with a thumbnail from the fixture preview.
- Text fields enforce the same caps as the schema and show a counter.

### 3. Preview

- A preview pane renders the draft in an `iframe` at `/[locale]/plantilla/borrador?token=<signed>`.
- The token is signed on the server, carries the tenant slug and draft id, and expires in 30 minutes. A bad or expired token returns 404.
- The response sets `Cache-Control: private, no-store` (rule 17) and `robots: noindex`. The route is absent from the sitemap.
- The pane switches between desktop 1280 px and phone 390 px widths. The phone width renders the PWA trees through the `?surface=pwa-mobile` override used only by this route.
- The preview reloads after each successful save.

### 4. Publish flow

1. The admin or staff member presses Publish. Icon `Upload` (rule 16).
2. The server runs `validateThemeDocument`.
3. If there are issues, a panel lists each issue with its code, path, and sentence. A click on an issue opens that field.
4. If there are no issues, a `ConfirmActionModal` shows the changed paths count. Confirm calls `publishThemeDraft`.
5. On success: a toast, `router.refresh()`, and the Versions tab shows the new row.

### 5. Major upgrade flow (staff only)

- The Versions tab lists sections whose variant has a newer major.
- "Preview upgrade" runs `migrateProps` into a temporary draft copy and opens the preview side by side with the current published look.
- "Apply to draft" writes the migrated section to the draft. Publish follows the normal flow.
- Fleet telemetry from the pins table shows how many tenants already use the new major.

### 6. Starter documents

- A new tenant starts from a starter document (one per generic kind from phase 2) chosen in the tenant creation flow.
- The template catalog page `/admin/plantillas` lists starters. Applying a starter creates a draft. It does not publish.

### 7. Retire the old editors

- When a tenant has a published document, the old CMS landing and theme screens show a notice and a link to the Design tab. Their save actions return `theme_document_active` for that tenant.
- When every tenant has a published document (fleet report), a follow-up change removes the old screens. That change needs its own mini-spec.

## Error codes

All phase 3 codes, plus:

| Code | Cause |
|---|---|
| `preview_token_invalid` | The preview token is bad or expired. |
| `theme_document_active` | An old editor tried to save a tenant that uses documents. |
| `upgrade_props_invalid` | `migrateProps` output fails the new schema. |

Each has its own sentence in `en.json`, `es.json`, and `pt.json`. An unknown code shows the raw code and asks the person to send it to support (rule 50).

## Options considered

| Option | Why rejected |
|---|---|
| Two separate editors for staff and admin | Duplicate code and drift. One editor with role and locks covers both. |
| Drag-and-drop page builder with free layout | Breaks the variant contract and contrast checks. Sections with fixed variants keep sites coherent. |
| Preview inside the editor DOM | Editor CSS and tenant CSS would mix. An iframe isolates tokens and fonts. |
| Public preview URL without a token | Leaks unpublished work. |
| JSON-schema form generator from Zod | Poor control over localized fields and image slots. `editorFields` is explicit. |

## Surfaces (Web vs PWA)

- **Editors (Tier B):** desktop-only. Narrow viewports get horizontal scroll and a notice.
- **Preview:** renders both public trees. The phone width uses the PWA tree so staff see the Tier A mobile look.
- **Public site:** no change from this phase. It reads published documents from phase 3.

## Analytics and audit

- `recordSystemAudit` comes from the phase 3 actions.
- `trackEvent` `click` with entity `admin:theme-document` for Publish, Rollback, and Upgrade preview (rule 08).
- Admin tours: a new tour for the Design tab. The tours of the old CMS screens are updated with the notice (rule 33).

## Plan outline

1. `useThemeDocumentEditor` with tests for dirty state, `document_stale`, and lock rendering.
2. Identity tab with live contrast.
3. Pages and Section tabs from `editorFields`.
4. Preview route with signed token, private cache, and noindex.
5. Publish, Versions, rollback, upgrade.
6. Starters in the tenant creation flow and `/admin/plantillas`.
7. Notice and `theme_document_active` on old editors. Tours. Dictionaries. Changelog row (rule 39).

## Risks and mitigation

| Risk | Mitigation |
|---|---|
| Admin hides a needed section | `sections.order` is staff-only by default. |
| Preview shows stale content | Reload after each save. The token names the draft id. |
| Editor files grow past 250 lines | One file per tab and per field kind (rule 03). |
| Two people edit at once | `document_stale` with a reload action that keeps the local changes in a diff view. |

## Definition of done

- Staff build a site from a starter, set locks, preview, and publish.
- An admin edits only unlocked fields. A direct call to the action with a locked path returns `field_locked`.
- Preview route tests: bad token 404, private cache header, noindex.
- Publish with a contrast failure shows the coded issue and opens the field.
- Rollback restores an older version as a new published version.
- Old editors return `theme_document_active` for migrated tenants.
- Tours and dictionaries in `en`, `es`, `pt`. Changelog row written.

## Out of scope

- Removing old editors (follow-up mini-spec).
- Email template design per tenant.
- Dashboard styling per tenant.

## Manual QA (user)

- As staff: create a tenant from a starter, change palette and fonts, add a section, lock two fields, preview on desktop and phone, publish.
- As institute admin of that tenant: edit an unlocked field, try a locked one, publish, roll back.
- Confirm that a publish on that tenant does not change another tenant.
