# Phase 7 — PWA install identity per tenant

**Status:** draft, waiting for approval.
**Umbrella:** `docs/superpowers/specs/2026-11-10-tenant-design-system-design.md`.
**ADR:** `docs/adr/2026-11-tenant-design-system.md`.
**Depends on:** phase 1 (tokens, contrast validator), phase 3 (published document).

## Understanding

- An installed PWA shows the tenant identity outside the page: app name, icon, splash color, status bar color, and shortcuts.
- Each tenant must get its own install identity from data. No tenant may get another tenant's icon or color.
- This is Tier A. Parents and students install the app.

## Current state (checked 2026-11-10)

1. `src/app/manifest.ts` and `src/app/layout.tsx` call `bundledPublicInstallIcon(templateKind)`. It returns the Nago logo only for `nago`.
2. When that icon exists, `theme_color` and `background_color` become `NAGO_INSTALL_CHROME`. Other tenants get `color.primary` and `color.background`.
3. Other tenants get icons from `buildWebManifestIcons(brand)` and `appendMaskableManifestIcons`. A maskable icon is the same file as the normal icon. No safe zone check exists.
4. Shortcuts point to parent payments and messages for every tenant, except CentroListo.
5. `manifest.ts` is `force-dynamic` and reads theme data on each request.

## Decision

### 1. Install tokens

Add to `DesignTokensV1` (phase 1 contract, optional group):

| Token | Default | Use |
|---|---|---|
| `install.theme` | `color.primary` | `theme_color`, `<meta name="theme-color">` |
| `install.background` | `color.background` | `background_color`, splash |
| `install.statusBar` | `default` | `apple-mobile-web-app-status-bar-style` (`default`, `black`, `black-translucent`) |

- `validateDesignTokens` checks `install.theme` against white and black text and picks the readable status bar text. A theme color with no AA pair fails with `install_theme_unreadable`.

### 2. Install icons as brand assets

- New brand asset slots per tenant: `install.icon.any` (square PNG, at least 512 px) and `install.icon.maskable` (square PNG, at least 512 px, logo inside the 80% safe zone).
- Upload in the existing brand assets panel with `InlineUploadProgressBar` (rule 48).
- Server generates 192, 256, 384, 512, and Apple 180 px sizes on upload and stores them under the tenant storage prefix.
- Validation codes: `install_icon_too_small`, `install_icon_not_square`, `install_icon_type`.
- If no maskable icon exists, the server builds one by padding the `any` icon on `install.background`.
- If no install icon exists, the manifest uses the favicon set. It never uses another tenant's asset.

### 3. Manifest and head

- `buildTenantManifest(input)` in `src/lib/pwa/` is pure. Input: brand name, short name, tagline, tokens, icon URLs, locale, shortcuts. Output: `MetadataRoute.Manifest`.
- `short_name` comes from a new brand key `app.short_name` (max 12 characters). If empty, it is the brand name cut at a word boundary.
- `manifest.ts` and the root layout `viewport.themeColor` read the published document. `bundledPublicInstallIcon` and `NAGO_INSTALL_CHROME` go away. The Nago icon and color move into Nago data.
- The manifest response sets `Cache-Control: public, max-age=300` with `Vary: Host`. It contains no personal data.

### 4. Shortcuts

- A tenant setting `pwa.shortcuts` lists shortcut ids from a fixed catalog (`parent_payments`, `parent_messages`, `student_schedule`, `student_tasks`, `events`).
- Default: `parent_payments`, `parent_messages`. A tenant without billing gets no payment shortcut.
- Labels come from the dictionaries in the manifest locale.

### 5. iOS splash

- The root layout emits `apple-touch-icon` from the 180 px install icon.
- No per-device splash images in this phase. iOS uses `install.background` and the icon.

## Options considered

| Option | Why rejected |
|---|---|
| Keep code per tenant for install icons | The same scale failure as the landing dispatchers. |
| Derive maskable icons only by padding | A logo with its own background looks wrong when padded. The upload slot allows a real maskable icon. |
| One static `manifest.webmanifest` per tenant at build | 1000 tenants change identity without a deploy. Data must apply on the next request (rule 46). |

## Surfaces (Web vs PWA)

- **Installed PWA (`pwa-mobile`):** name, icons, splash, status bar, and shortcuts come from the tenant. `PublicInstalledTopBar` and `PublicPwaTabBar` read `install.theme` through `--ds-install-theme`.
- **Phone browser (`web-mobile`):** the browser toolbar uses `theme_color`.
- **Desktop (`web-desktop`):** installed desktop windows use the same manifest.
- **Brand assets panel (Tier B):** two new upload slots.
- Tests that must stay green: `PublicInstalledTopBar`, `PublicPwaTabBar`, manifest tests, and `tierADashboard*`.

## Plan outline

1. TDD `buildTenantManifest` and install token validation.
2. Icon upload slots, size generation, and validation codes.
3. Switch `manifest.ts` and the root layout. Remove `bundledPublicInstallIcon` and `NAGO_INSTALL_CHROME`. Move Nago data.
4. Shortcut setting and catalog.
5. Dictionaries in `en`, `es`, `pt`. Changelog row (rule 39).

## Risks and mitigation

| Risk | Mitigation |
|---|---|
| Installed apps keep the old icon | Browsers refresh the manifest on their own schedule. Document this in the changelog row. |
| Nago loses its install look | Nago data gets the same icon and color before the code path is removed. Test the Nago manifest output. |
| Upload of huge images | Reuse the 15 MB cap and server resize. |

## Definition of done

- `manifest.ts` and the root layout contain no tenant slug and no tenant constant.
- Two tenants return two different manifests with their own icons and colors (test).
- A tenant with no install icon falls back to its own favicon set.
- Icon validation codes have dictionary sentences and tests.

## Out of scope

- Push notification branding.
- Per-device iOS splash images.

## Manual QA (user)

- Install two tenants on Android and iOS. Each shows its own name, icon, and splash color.
- Change the install color of one tenant, reinstall, and confirm the other tenant is unchanged.
