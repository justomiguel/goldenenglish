# Phase 6 — Design editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-11-10-design-editor-design.md`
**Depends on:** phases 1, 2, 3. Phase 4 is not required. A tenant on the legacy fallback can start a first draft from `legacyThemeToDocument`.

**Goal:** Staff and institute admins edit one theme document per tenant in one editor, with preview, publish, rollback, and major upgrades.

**Architecture:** One desktop organism `ThemeDocumentEditor` with a hook `useThemeDocumentEditor` that wraps the phase 3 actions. The staff route mounts it with `actorRole: "staff"` and the CMS route with `actorRole: "admin"`. Fields come from variant `editorFields`. A signed-token preview route renders the draft in an `iframe`.

**Tech Stack:** Next.js App Router, React 19, phase 3 actions, `usePersistentPageTab`, `ConfirmActionModal`, `InlineUploadProgressBar`, Web Crypto HMAC, Vitest, Testing Library.

## Global Constraints

- Tier B, desktop-only. No PWA tree for the editor (rule 05).
- Tab persistence: `usePersistentPageTab` with key `design` (rule 42).
- Every button has a leading Lucide icon (rule 16). Publish uses `Upload`.
- No native dialogs (rule 18). Confirmations use `ConfirmActionModal`.
- Image fields use `InlineUploadProgressBar` (rule 48).
- Preview: token TTL 30 minutes, `Cache-Control: private, no-store`, `robots: noindex`, not in the sitemap (rules 17, 47).
- New codes: `preview_token_invalid`, `theme_document_active`, `upgrade_props_invalid`. Unknown codes show the raw code (rule 50).
- After success, call `router.refresh()` inside the hook (rule 27).
- No file over 250 lines. Split each tab into its own folder.
- Admin tours: update the tour contract tests (rule 33) for the CMS screens that change.

## File map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/hooks/useThemeDocumentEditor.ts` | Draft state and handlers. |
| Create | `src/lib/theme-document/editorDraftOps.ts` | Pure edits: set token, set field, move section, add section, remove section, set lock. |
| Create | `src/lib/theme-document/previewToken.ts` | Pure sign and verify with an injected key. |
| Create | `src/lib/theme-document/server/previewTokenKey.ts` | Reads the signing key. |
| Create | `src/components/desktop/organisms/theme-document-editor/ThemeDocumentEditor.tsx` | Shell, tabs, preview pane. |
| Create | `…/identity/IdentityTab.tsx`, `ColorPairRow.tsx`, `FontSelect.tsx`, `LevelSelect.tsx` | Identity tab. |
| Create | `…/pages/PagesTab.tsx`, `PageSectionList.tsx`, `VariantPicker.tsx` | Pages tab. |
| Create | `…/section/SectionTab.tsx`, `EditorFieldControl.tsx`, `LocalizedTextField.tsx`, `ImageSlotField.tsx`, `ListField.tsx` | Section tab. |
| Create | `…/versions/VersionsTab.tsx`, `UpgradeRow.tsx` | Versions tab. |
| Create | `…/PublishIssuesPanel.tsx`, `LockedFieldNotice.tsx`, `PreviewPane.tsx` | Shared pieces. |
| Create | `src/app/[locale]/plantilla/borrador/page.tsx` | Preview route. |
| Create | `src/app/[locale]/dashboard/admin/cms/design/page.tsx` | Admin mount. |
| Modify | Staff tenant route (CentroListo panel) | Staff mount as a Design tab. |
| Modify | Old CMS landing and theme actions and screens | Notice and `theme_document_active`. |
| Create | `src/lib/theme-document/starterDocuments.ts` | Starter per generic kind. |
| Modify | Tenant creation flow, `/admin/plantillas` page | Starter pick and apply. |
| Modify | `src/app/sitemap.ts` test | Assert no `/plantilla/borrador`. |
| Modify | `src/dictionaries/{en,es,pt}.json` | `admin.designEditor.*`. |
| Test | `src/__tests__/hooks/useThemeDocumentEditor.test.ts`, `src/__tests__/lib/theme-document/{editorDraftOps,previewToken,starterDocuments}.test.ts`, `src/__tests__/components/desktop/theme-document-editor/*.test.tsx`, `src/__tests__/app/plantillaBorradorPage.test.tsx` | |

## Tasks

### Task 1: Pure draft operations

**Produces:**

```ts
export type DraftOp =
  | { kind: "setToken"; path: string; value: string }
  | { kind: "setFont"; role: "heading" | "body"; id: string }
  | { kind: "setField"; scope: "home" | ThemePageId; sectionId: string; field: string; value: unknown }
  | { kind: "moveSection"; scope: "home" | ThemePageId; sectionId: string; toIndex: number }
  | { kind: "addSection"; scope: "home" | ThemePageId; section: ThemeSection; atIndex: number }
  | { kind: "removeSection"; scope: "home" | ThemePageId; sectionId: string }
  | { kind: "setVariant"; scope: "home" | ThemePageId; sectionId: string; variantId: string; major: number }
  | { kind: "setLock"; path: string; role: "staff" | "admin" };
export function applyDraftOp(doc: ThemeDocumentV1, op: DraftOp): ThemeDocumentV1;
export function lockPathForOp(op: DraftOp): string;
```

- [x] Red: `editorDraftOps.test.ts`.
  - Each op returns a new object and leaves the input unchanged.
  - `moveSection` keeps the other order.
  - `setField` on a page section edits `pages.<id>`.
  - `lockPathForOp` returns the same paths that `findLockedFieldEdits` reports for that change. Assert it by running both on each op.
- [x] Green.

### Task 2: Hook

**Produces:**

```ts
export function useThemeDocumentEditor(input: {
  locale: Locale; siteThemeId: string; actorRole: "staff" | "admin";
  initial: { document: ThemeDocumentV1; baseHash: string | null; versions: ThemeVersionRow[] };
  actions: ThemeDocumentEditorActions; // injected server actions for that role
}): {
  data: { document: ThemeDocumentV1; dirty: boolean; issues: ThemeDocumentIssue[]; versions: ThemeVersionRow[] };
  error: { code: string; path?: string } | null;
  isLoading: boolean;
  handlers: {
    apply(op: DraftOp): void; save(): Promise<void>; publish(): Promise<void>;
    discard(): Promise<void>; rollback(snapshotId: string): Promise<void>;
    isLocked(path: string): boolean;
  };
};
```

- [x] Red: `useThemeDocumentEditor.test.ts`. Mock `next/navigation` `useRouter` with `vi.hoisted`.
  - `apply` sets `dirty`.
  - `save` success clears `dirty`, stores the new hash, and calls `refresh`.
  - `save` with `document_stale` sets `error.code`, keeps `dirty`, and does not call `refresh`.
  - `publish` with validation issues fills `issues`.
  - `isLocked` is true for an admin on a missing `editableBy` key and false for staff.
  - `apply` on a locked path for an admin is a no-op and sets `error.code = "field_locked"`.
- [x] Green.

### Task 3: Identity tab

- [x] Red: `IdentityTab.test.tsx`.
  - Each color pair row shows the ratio from `contrastRatio` and an AA pass or fail text. The state is not shown by color alone (rule 26).
  - Font selects list `FONT_CATALOG` filtered by `isFontAllowedForTenant`.
  - A locked field renders read-only with `LockedFieldNotice`.
  - Staff see a lock toggle per field. Admins do not.
- [x] Green. The color input is a native `input type="color"` plus a hex text field. Both write through `apply`.

### Task 4: Pages and Section tabs

- [x] Red: `PagesTab.test.tsx`.
  - The page list has home plus `THEME_PAGE_IDS`.
  - Reorder buttons (`ArrowUp`, `ArrowDown`, with `aria-label` from the dictionary) emit `moveSection`.
  - The variant picker lists `variantsForTenant(slug, slot)` only.
  - An admin with `sections.order` locked sees no reorder controls.
- [x] Red: `SectionTab.test.tsx`. One test per `VariantEditorField.kind`.
  - `text` has a counter and a cap.
  - `longText` is a textarea.
  - `select` shows its options.
  - `toggle` is a switch with a label.
  - `list` can add and remove items.
  - `image` mounts `InlineUploadProgressBar` only while a file is read or sent.
  - Localized fields show `es`, `en`, and `pt` inputs.
- [x] Green. `EditorFieldControl` switches on `kind`. Labels come from `labelKey`.

### Task 5: Preview route

**Produces:**

```ts
export async function signPreviewToken(payload: { tenantSlug: string; draftId: string; exp: number }, key: CryptoKey): Promise<string>;
export async function verifyPreviewToken(token: string, key: CryptoKey, now: number): Promise<{ ok: true; tenantSlug: string; draftId: string } | { ok: false; code: "preview_token_invalid" }>;
```

- [x] Red: `previewToken.test.ts`. A valid token verifies. A token with a tampered payload, a wrong key, or an expired time fails with `preview_token_invalid`.
- [x] Red: `plantillaBorradorPage.test.tsx`.
  - A bad token calls `notFound()`.
  - A token for tenant `a` on host `b` calls `notFound()`.
  - The response headers include `Cache-Control: private, no-store`.
  - Metadata has `robots: { index: false, follow: false }`.
  - `?surface=pwa-mobile` passes the override to the surface provider.
- [x] Green. Signing key: a secret env var `THEME_PREVIEW_SIGNING_KEY`. This is a secret, so an env var is correct (rule 46). Add it to `.env.example` with no value and to `docs/runbooks/`. Set `Cache-Control` through `headers()` in route config or middleware for this path. Pick the pattern the calendar feed route uses.
- [x] Add the sitemap assertion.

### Task 6: Publish, versions, rollback, upgrade

- [x] Red: `PublishIssuesPanel.test.tsx`. Each issue shows its sentence and `Code: <code>`. A click calls `onOpenField(path)`. An unknown code shows the raw code.
- [x] Red: `VersionsTab.test.tsx`.
  - The rows list version, date, author, and hash prefix.
  - Rollback opens `ConfirmActionModal` and then calls `handlers.rollback`.
  - An admin sees rollback only when `editableBy["publish.rollback"] === "admin"`.
  - Upgrade rows appear for sections where `latestMajor(id) > major`, for staff only.
- [x] Red: `UpgradeRow.test.tsx`.
  - "Preview upgrade" runs `migrateProps` and validates with the new `propsSchema`.
  - A failure shows `upgrade_props_invalid`.
  - "Apply to draft" emits `setVariant` plus `setField` ops.
  - The row shows the fleet count from a prop.
- [x] Green. Fleet count: `loadVariantFleetCounts` reads `platform_tenant_variant_pins` in pages of 1000 and groups by `variant_id, major`. Pin rows grow with each institute (rule 13).

### Task 7: Mounts, starters, old editors, copy

- [x] Admin mount at `dashboard/admin/cms/design/page.tsx`. It loads the draft, the published document, or the legacy fallback, and the versions. Add a nav item to the CMS section. Add `pathnameToEntity` mapping if the CMS nav uses it (rule 08).
- [x] Staff mount at `admin/tenants/[slug]/theme/design` with `actorRole: "staff"`. The tenant page links to it. The fleet operator tab stays unchanged.
- [x] Red: `starterDocuments.test.ts`. One starter per generic kind. Each passes `validateThemeDocument(doc, null)`. Each equals `legacyThemeToDocument` for that kind with default content.
- [x] Tenant creation: `/admin/plantillas` links each starter to `admin/tenants/new?starter=`. A new tenant with that query opens Design and `applyThemeStarterAction` saves a draft. It does not publish.
- [x] Old editors: their save actions call `hasPublishedThemeDocument(siteThemeId)`. If true, they return `{ ok: false, code: "theme_document_active" }` and log `logServerWarn` with scope `cms.legacyEditor`. The screens show a notice with a link to the Design tab. Add tests to the existing action tests for that code.
- [x] Dictionaries: every label, `aria-label`, and code sentence in `en`, `es`, `pt`. Run `neutralSpanishCopy.test.ts`.
- [x] Tours: update the CMS tour steps and their L1/L2 contract tests (rule 33).

### Task 8: Gate and commit

- [ ] `npx vitest run src/__tests__/hooks/useThemeDocumentEditor.test.ts src/__tests__/lib/theme-document src/__tests__/components/desktop/theme-document-editor src/__tests__/app`, `npx tsc --noEmit`, `npx eslint`.
- [ ] Changelog row `design-editor`, area `cms`.
- [ ] Commit spec + plan + code. Do not push.

## Manual QA (user)

- As staff: lock a color, save, publish, open the site.
- As admin: confirm the locked field is read-only. Edit a hero title, preview on phone width, publish, roll back.
- Open an expired preview link and confirm a 404.

## Self-review

- Spec sections 1–7 map to tasks 2–7. Error codes map to tasks 5, 6, and 7.
- Names from phase 3: `createThemeDocumentService`, `findLockedFieldEdits`, `validateThemeDocument`, `themeDocumentIssueMessage`. From phase 2: `variantsForTenant`, `latestMajor`, `VariantEditorField`.
