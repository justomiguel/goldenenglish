# Phase 7 — PWA install identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-11-10-pwa-install-identity-design.md`
**Depends on:** phase 1 (tokens, validator) and phase 3 (published document read).

**Goal:** Each tenant installs with its own name, colors, icons, and shortcuts. No tenant gets the Nago chrome.

**Architecture:** Install tokens join `DesignTokensV1` as an optional group. A pure `buildTenantManifest` builds the manifest from the brand, the tokens, the icon URLs, and the shortcut setting. Icons are tenant brand assets resized on the server at upload time.

**Tech Stack:** Next.js `MetadataRoute.Manifest`, `sharp` for resizing (new dependency, see task 2), Supabase Storage, Vitest.

## Global Constraints

- Tokens: `install.theme` (default `color.primary`), `install.background` (default `color.background`), `install.statusBar` (`default | black | black-translucent`, default `default`).
- Codes: `install_theme_unreadable`, `install_icon_too_small`, `install_icon_not_square`, `install_icon_type`.
- Icons: PNG, square, at least 512 px. Sizes 192, 256, 384, 512, and Apple 180.
- Maskable fallback: the `any` icon padded to the 80% safe zone on `install.background`.
- No install icon: use the tenant favicon set. Never another tenant's asset.
- `app.short_name`: max 12 characters. Fallback: brand name cut at a word boundary.
- Manifest headers: `Cache-Control: public, max-age=300`, `Vary: Host`. No personal data.
- Shortcut catalog: `parent_payments`, `parent_messages`, `student_schedule`, `student_tasks`, `events`. Default `parent_payments`, `parent_messages`. No payment shortcut without billing.
- Upload UI uses `InlineUploadProgressBar` (rule 48).
- Tier A impact: Web and PWA trees read the same `<head>`. Run `PublicPwaTabBar` and `PublicInstalledTopBar` tests.

## File map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `src/lib/design-tokens/designTokensV1.ts`, `parseDesignTokens.ts`, `validateDesignTokens.ts` | `install` group and check. |
| Create | `src/lib/pwa/buildTenantManifest.ts` | Pure manifest builder. |
| Create | `src/lib/pwa/pwaShortcuts.ts` | Shortcut catalog and parser. |
| Create | `src/lib/pwa/shortNameFromBrand.ts` | Short name rule. |
| Create | `src/lib/brand/installIconSlots.ts` | Slot ids, size list, validation (pure, takes width, height, mime). |
| Create | `src/lib/brand/server/resizeInstallIcon.ts` | `sharp` resize and maskable padding. |
| Modify | `src/app/[locale]/dashboard/admin/cms/siteThemeBrandAssetActions.ts` | Upload slots. |
| Modify | `src/hooks/useSiteThemeBrandAssetUploads.ts` and the brand assets panel | Two install icon fields. |
| Modify | `src/app/manifest.ts`, `src/app/layout.tsx` | Use the builder and tokens. |
| Delete | `src/lib/brand/bundledPublicInstallIcon.ts` and its test | |
| Create | `supabase/migrations/<next>_nago_install_identity.sql` | `-- ge:brand-data nago`: Nago install color and icon paths. |
| Modify | Site settings admin screen | `app.short_name` field and `pwa.shortcuts` checkboxes. |
| Modify | `src/dictionaries/{en,es,pt}.json` | Labels, shortcut names, codes. |
| Test | `src/__tests__/lib/pwa/*.test.ts`, `src/__tests__/lib/brand/installIconSlots.test.ts`, `src/__tests__/app/manifest.test.ts`, `src/__tests__/app/siteThemeBrandAssetActions.installIcon.test.ts` | |

## Tasks

### Task 1: Install tokens and manifest builder

**Produces:**

```ts
export interface TenantManifestInput {
  name: string; shortName: string; description: string; locale: Locale;
  tokens: DesignTokensV1;
  icons: { any: InstallIconSet | null; maskable: InstallIconSet | null; faviconFallback: string[] };
  shortcuts: PwaShortcutId[]; hasBilling: boolean; startUrl: string;
  labels: Record<PwaShortcutId, string>;
}
export interface InstallIconSet { sizes: Record<192 | 256 | 384 | 512 | 180, string> }
export function buildTenantManifest(input: TenantManifestInput): MetadataRoute.Manifest;
export function shortNameFromBrand(name: string, explicit: string | null): string;
export const PWA_SHORTCUT_IDS: readonly ["parent_payments","parent_messages","student_schedule","student_tasks","events"];
export function parsePwaShortcuts(value: string | null): PwaShortcutId[];
```

- [ ] Red: `validateDesignTokens.install.test.ts`. A dark theme passes with white text. A mid-gray theme (`#808080`) fails with `install_theme_unreadable`. An unknown `install.statusBar` value fails with `token_invalid_value`.
- [ ] Red: `shortNameFromBrand.test.ts`.
  - `"Instituto Golden English"` → `"Instituto"`.
  - An explicit value over 12 characters is cut at 12.
  - A one-word name of 15 characters is cut to 12.
- [ ] Red: `buildTenantManifest.test.ts`.
  - `theme_color` and `background_color` come from the tokens.
  - Icons list `any` and `maskable` with `purpose`.
  - No icons: favicon entries only.
  - `hasBilling: false` drops `parent_payments`.
  - Shortcut names come from `labels`.
  - Two inputs for two tenants share no icon URL.
- [ ] Green.

### Task 2: Icon slots, resizing, and upload

**Produces:**

```ts
export const INSTALL_ICON_SLOTS = ["install.icon.any", "install.icon.maskable"] as const;
export function validateInstallIcon(meta: { width: number; height: number; mime: string }):
  { ok: true } | { ok: false; code: "install_icon_too_small" | "install_icon_not_square" | "install_icon_type" };
export async function resizeInstallIcon(input: Buffer, opts: { maskableFrom?: "any"; background: string }): Promise<Record<192|256|384|512|180, Buffer>>;
```

- [ ] Dependency: add `sharp` (rule 07: no image library is in `package.json` today; Next already uses `sharp` for image optimization). Run `npm audit` and note the result in the commit body (rule 04).
- [ ] Red: `installIconSlots.test.ts`. 511×511 → too small. 512×600 → not square. `image/jpeg` → type. 1024×1024 PNG → ok.
- [ ] Red: `resizeInstallIcon.test.ts` on a generated 1024 px PNG fixture. The output has 5 buffers with the right dimensions. Maskable output has the background color at the corner pixel.
- [ ] Red: `siteThemeBrandAssetActions.installIcon.test.ts`.
  - An invalid icon returns the code and logs `logServerWarn` with scope `cms.brandAssets.installIcon`.
  - A valid upload writes 5 files under the tenant prefix and sets the property keys `install.icon.any.<size>`.
  - It calls `revalidatePath` for the manifest and the layout.
  - It calls `recordSystemAudit`.
- [ ] Green. UI: two file fields in the brand assets panel with `InlineUploadProgressBar` (read phase determinate, send phase indeterminate). Error text from the dictionary with the code.

### Task 3: Manifest and head switch

- [ ] Red: `manifest.test.ts`.
  - Tenant `golden` with no icons gets its favicon set and Golden tokens.
  - Tenant `nago` gets the Nago data from the migration.
  - The output for `golden` contains no `nago` string.
  - The route exports no `dynamic = "force-dynamic"`.
- [ ] Red: layout test. `viewport.themeColor` equals `install.theme`. An `apple-touch-icon` link points at the 180 px icon. The status bar meta equals `install.statusBar`.
- [ ] Green.
  - `manifest.ts` reads `loadPublishedThemeDocument` for tokens, the brand for name and icons, and settings for shortcuts.
  - Add `Cache-Control` and `Vary: Host`. If `manifest.ts` cannot set headers, move the manifest to a route handler `src/app/manifest.webmanifest/route.ts` and update the `<link rel="manifest">`.
  - Remove `NAGO_INSTALL_CHROME` and `bundledPublicInstallIcon`.
- [ ] Write the Nago brand data migration with the current Nago color and icon paths. Apply with the all-tenants command. Brand data files skip shared-schema targets (rule 45).

### Task 4: Settings

- [ ] Red: the settings form test. `app.short_name` has a 12-character cap and a counter. Shortcut checkboxes hide `parent_payments` when billing is off. Save writes `pwa.shortcuts` as a comma list.
- [ ] Green. Server action validates with `parsePwaShortcuts` and audits.

### Task 5: Copy, changelog, commit

- [ ] Dictionary keys for labels, shortcut names, and the 4 codes plus `unknown`. Run `neutralSpanishCopy.test.ts`.
- [ ] Run `npx vitest run src/__tests__/lib/pwa src/__tests__/lib/brand src/__tests__/app/manifest.test.ts src/__tests__/components/pwa`, `npx tsc --noEmit`, `npx eslint`.
- [ ] Changelog row `pwa-install-identity`, area `portal`.
- [ ] Commit spec + plan + code + migration. Do not push.

## Manual QA (user)

- Install Golden and Nago on Android and iOS. Check the name, the icon, the splash color, and the shortcuts.
- Upload a non-square icon and confirm the coded sentence.

## Self-review

- Spec sections 1–5 map to tasks 1–4.
- `buildTenantManifest`, `INSTALL_ICON_SLOTS`, and `install.*` tokens are new names. Phase 10 reads `install.theme` for the PWA top bar.
