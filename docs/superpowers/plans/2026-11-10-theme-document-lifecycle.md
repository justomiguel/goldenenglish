# Phase 3 — Theme document lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-11-10-theme-document-lifecycle-design.md`
**Depends on:** phase 1 (`DesignTokensV1`, `validateDesignTokens`) and phase 2 (`ThemeSection`, `resolveSection`).

**Goal:** Each tenant has a draft and immutable published snapshots of one theme document. Publish and rollback change only that tenant.

**Architecture:** A pure module `src/lib/theme-document/` holds the schema, lock check, publish validation, and the legacy fallback. A tenant migration adds `theme_documents`, a trigger, and RPCs for publish and rollback. Server orchestration in `src/lib/theme-document/server/` serves both the institute CMS actions and the CentroListo staff panel. The public read goes through a `security definer` RPC with a per-tenant cache tag.

**Tech Stack:** Postgres (RLS, triggers, `security definer`), Supabase JS, Next.js `unstable_cache` / `revalidateTag`, Zod, Vitest.

## Global Constraints

- `editableBy` paths: `tokens.color.<key>`, `fontIds.heading`, `fontIds.body`, `sections.<id>.props.<field>`, `sections.<id>.variant`, `sections.order`, `pages.<page>.…`. A missing key means `staff`.
- Codes: `document_stale`, `draft_missing`, `snapshot_not_found`, `field_locked`, `document_too_large`, `token_missing`, plus the phase 1 and phase 2 codes.
- Document cap: 256 KB of canonical JSON.
- Log scopes: `themeDocument.save`, `themeDocument.publish`, `themeDocument.rollback`, `themeDocument.pins`.
- Audit: `recordSystemAudit` with `resource_type: "theme_document"`.
- SQL qualifies `public.` (rule 45). Additive only (rule 21).
- Publish: `revalidateTag(siteThemeActiveCacheTagForTenant(slug))` on the server, `router.refresh()` on the client (rule 27).
- No UI in this phase. Phase 6 builds it.

## File map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/lib/theme-document/themeDocumentV1.ts` | Types and `themeDocumentV1Schema`. |
| Create | `src/lib/theme-document/canonicalDocument.ts` | Stable JSON and `documentHash` (Web Crypto sha256). |
| Create | `src/lib/theme-document/findLockedFieldEdits.ts` | Lock check. |
| Create | `src/lib/theme-document/validateThemeDocument.ts` | Publish validation. |
| Create | `src/lib/theme-document/legacyThemeToDocument.ts` | Fallback from `site_themes`. |
| Create | `src/lib/theme-document/themeDocumentIssueMessage.ts` | Code → dictionary sentence. |
| Create | `src/lib/theme-document/server/themeDocumentRepository.ts` | Supabase adapter (injected client). |
| Create | `src/lib/theme-document/server/themeDocumentService.ts` | `saveDraft`, `publish`, `rollback`, `discard`. |
| Create | `src/lib/theme-document/server/loadPublishedThemeDocument.ts` | Cached public read with fallback. |
| Create | `src/lib/theme-document/server/writeVariantPins.ts` | Pulsar pins write. |
| Create | `src/app/[locale]/dashboard/admin/cms/themeDocumentActions.ts` | Institute admin actions. |
| Create | `src/app/[locale]/dashboard/platform/tenants/[slug]/themeDocumentActions.ts` | Staff actions through the Pulsar tenant client. Confirm the staff route folder before you create it. |
| Create | `supabase/migrations/<next>_theme_documents.sql` | Table, indexes, trigger, RLS, RPCs, `site_themes.published_document_id`. |
| Create | `supabase/pulsar-migrations/<next>_platform_tenant_variant_pins.sql` | Pins table. |
| Modify | `supabase/migrations/masterdb.sql` | New table and column. |
| Modify | `src/lib/theme/loadActiveTheme.ts` | Expose `publishedDocument` on the snapshot. |
| Modify | `scripts/report-variant-fleet.mjs` | Read pins. |
| Modify | `src/dictionaries/{en,es,pt}.json` | `admin.themeDocument.issue.*`. |
| Test | `src/__tests__/lib/theme-document/*.test.ts`, `src/__tests__/app/themeDocumentActions.test.ts`, `src/__tests__/supabase/themeDocumentsRls.test.ts` | |

## Tasks

### Task 1: Schema, canonical hash, size cap

**Produces:**

```ts
export const THEME_PAGE_IDS = ["register","contact","blog","privacy","answers","events","findClass"] as const;
export type ThemePageId = (typeof THEME_PAGE_IDS)[number];
export interface ThemeDocumentV1 {
  contractVersion: 1;
  tokens: DesignTokensV1;
  fontIds: { heading: string; body: string };
  sections: readonly ThemeSection[];
  pages: Partial<Record<ThemePageId, { sections: readonly ThemeSection[] }>>;
  editableBy: Record<string, "staff" | "admin">;
}
export const themeDocumentV1Schema: z.ZodType<ThemeDocumentV1>;
export function canonicalDocumentJson(doc: ThemeDocumentV1): string;
export async function documentHash(doc: ThemeDocumentV1): Promise<string>;
export const THEME_DOCUMENT_MAX_BYTES = 262_144;
```

- [ ] Red: `themeDocumentV1.test.ts`.
  - A minimal valid document parses.
  - An unknown page id fails.
  - Duplicate section ids fail.
  - An `editableBy` value other than `staff` / `admin` fails.
- [ ] Red: `canonicalDocument.test.ts`.
  - Key order does not change the hash.
  - A changed prop changes the hash.
  - A document over the cap is reported by `isDocumentTooLarge`.
- [ ] Green.

### Task 2: Locks and publish validation

**Produces:**

```ts
export function findLockedFieldEdits(
  prev: ThemeDocumentV1, next: ThemeDocumentV1, actorRole: "staff" | "admin",
): string[]; // changed paths the actor cannot edit
export type ThemeDocumentIssue = { code: string; path?: string; token?: string };
export function validateThemeDocument(
  doc: ThemeDocumentV1, tenantSlug: string | null,
): { ok: true } | { ok: false; issues: ThemeDocumentIssue[] };
```

- [ ] Red: `findLockedFieldEdits.test.ts`.
  - Staff can change anything, including `editableBy`.
  - An admin who changes `editableBy` gets `["editableBy"]`.
  - An admin who edits `sections.hero.props.title` with `editableBy` = `admin` gets `[]`. With the key missing, the admin gets the path.
  - Reordering by an admin gives `sections.order` unless that path is `admin`.
  - A variant swap gives `sections.<id>.variant`.
- [ ] Red: `validateThemeDocument.test.ts`. One case per code: `contrast_below_aa`, `font_not_in_catalog`, `variant_version_missing`, `variant_not_available`, `variant_props_invalid`, `token_missing`. Page sections get the path `pages.register.sections.<id>`.
- [ ] Green. Reuse `validateDesignTokens` (on the flat form of `tokens`) and `resolveSection`.

### Task 3: Legacy fallback

**Produces:** `export function legacyThemeToDocument(row: { properties: ThemeProperties; skin_content: unknown; template_kind: SiteThemeKind }): ThemeDocumentV1;`

- [ ] Red: `legacyThemeToDocument.test.ts`.
  - For each generic kind, `sections` equals `genericKindToSections(kind)` and props come from `resolveSkin`.
  - Tokens equal `parseDesignTokens(merged properties)`.
  - For a bespoke kind, `sections` is one `page.bespoke-<kind>` section. Register that variant id in phase 2's `page` slot as a bridge that renders the current bespoke landing. Phase 4 removes it.
  - `editableBy` is `{}`.
- [ ] Green. If the bridge variant does not exist yet, add it in this task to `src/lib/design-variants/registry/page.ts` with `owner` set to the kind owner from `EXCLUSIVE_THEME_OWNERS`.

### Task 4: Tenant migration

- [ ] Write `supabase/migrations/<next>_theme_documents.sql`.
  - Table `public.theme_documents` with the spec columns and `check (status in ('draft','published','superseded'))`.
  - `create unique index … where status = 'draft'` and `… where status = 'published'`, both on `site_theme_id`.
  - Trigger `theme_documents_block_snapshot_edit`. It raises `snapshot_immutable` when `old.status in ('published','superseded')` and `new.document is distinct from old.document`.
  - `alter table public.site_themes add column if not exists published_document_id uuid references public.theme_documents(id)`.
  - RLS on: no `anon` policy. Admin policies use the existing `public.is_admin()` helper. Check its exact name in `masterdb.sql` first.
  - `public.get_published_theme_document(p_site_theme_id uuid) returns jsonb`, `security definer`, `set search_path = public`, granted to `anon, authenticated`.
  - `public.publish_theme_document(p_site_theme_id uuid, p_expected_hash text) returns table(id uuid, version int)`. It checks admin, locks the draft row `for update`, raises `draft_missing` or `document_stale`, sets the old published row to `superseded`, sets the draft to `published` with `version = coalesce(max,0)+1`, and updates `site_themes.published_document_id`. All in one statement block.
  - `public.rollback_theme_document(p_site_theme_id uuid, p_snapshot_id uuid)`. It raises `snapshot_not_found` and inserts a copy as a new published version with `based_on_id`.
- [ ] Red: `themeDocumentsRls.test.ts` on the isolated E2E database (`E2E_STACK=isolated`).
  - `anon` select on the table returns 0 rows.
  - `anon` gets the published document through the RPC.
  - An admin update of a published row's `document` raises `snapshot_immutable`.
  - A non-admin publish raises.
- [ ] Update `masterdb.sql`. Apply: `npm run sql:apply-migration:all-tenants:pg -- supabase/migrations/<file>`.
- [ ] Write the Pulsar pins migration with the primary key `(tenant_slug, variant_id, major)`. Apply it through the Pulsar migration path in `docs/runbooks/`.

### Task 5: Service and actions

**Produces:**

```ts
type ServiceResult<T> = { ok: true; data: T } | { ok: false; code: string; path?: string };
export function createThemeDocumentService(deps: {
  client: SupabaseClient; tenantSlug: string; actor: { id: string; role: "staff" | "admin" };
  pins: (slug: string, sections: ThemeSection[]) => Promise<void>;
}): {
  saveDraft(input: { siteThemeId: string; document: unknown; baseHash: string | null }): Promise<ServiceResult<{ hash: string }>>;
  publish(input: { siteThemeId: string; expectedHash: string }): Promise<ServiceResult<{ id: string; version: number }>>;
  rollback(input: { siteThemeId: string; snapshotId: string }): Promise<ServiceResult<{ id: string; version: number }>>;
  discard(input: { siteThemeId: string }): Promise<ServiceResult<null>>;
};
```

- [ ] Red: `themeDocumentService.test.ts` with a fake repository.
  - `saveDraft` rejects an invalid schema with `variant_props_invalid` or a Zod path.
  - It rejects a stale `baseHash` with `document_stale` and a locked admin edit with `field_locked` and the path.
  - It rejects an oversize document with `document_too_large`.
  - `publish` runs `validateThemeDocument` and returns the first issue.
  - `publish` maps RPC errors `draft_missing` and `document_stale` to codes.
  - It calls `pins` after success. A pins failure keeps `ok: true` and logs `themeDocument.pins` with `pins_write_failed`.
  - Each failure logs `[ge:server]` with its scope.
  - Success calls `recordSystemAudit` with `{ version, documentHash, changedPaths }`.
- [ ] Red: `themeDocumentActions.test.ts`.
  - The action checks the admin session (`assertAdmin`).
  - On success it calls `revalidateTag(siteThemeActiveCacheTagForTenant(slug))` and `revalidatePath` for the locale paths.
  - It returns the service code unchanged.
- [ ] Green. The staff action builds the same service with the Pulsar tenant client and `actor.role = "staff"`.

### Task 6: Read path

**Produces:** `export async function loadPublishedThemeDocument(tenantSlug: string): Promise<{ document: ThemeDocumentV1; source: "published" | "legacy" }>;`

- [ ] Red: `loadPublishedThemeDocument.test.ts`.
  - With a published row, it returns `source: "published"`.
  - Without one, it returns the legacy document.
  - An RPC error falls back to legacy and logs `themeDocument.read`.
  - The cache key and tags include the tenant slug.
- [ ] Green. Add `publishedDocument` to `ActiveThemeSnapshot`. Callers stay unchanged in this phase.
- [ ] Red: an integration test with two fake tenant clients. Publishing in `a` does not change `b`'s loaded document or tags.

### Task 7: Copy, fleet report, gate

- [ ] Dictionary keys `admin.themeDocument.issue.<code>` for every code in Global Constraints plus `unknown` with `{code}`. Unit test `themeDocumentIssueMessage.test.ts`: a known code, a validation code with `{path}`, and the unknown path that shows the raw code (rule 50).
- [ ] Switch `scripts/report-variant-fleet.mjs` to read `platform_tenant_variant_pins` and fall back to `genericKindToSections` for tenants with no pins.
- [ ] `npx vitest run src/__tests__/lib/theme-document src/__tests__/app/themeDocumentActions.test.ts`, `npx tsc --noEmit`, `npx eslint`.
- [ ] No changelog row. Nobody sees a change.
- [ ] Commit spec + plan + code + migrations. Do not push.

## Self-review

- Spec sections 1–8 map to tasks 1–7. Section 7 (pins) maps to tasks 4, 5, and 7.
- Names that phase 6 uses: `createThemeDocumentService`, `findLockedFieldEdits`, `validateThemeDocument`, `themeDocumentIssueMessage`, `loadPublishedThemeDocument`.
