# Phase 1 — Design tokens v1 and font catalog

**Status:** draft, waiting for approval.
**Umbrella:** `docs/superpowers/specs/2026-11-10-tenant-design-system-design.md` (approved).
**ADR:** `docs/adr/2026-11-tenant-design-system.md`.

## Understanding

- Phase 1 defines the token contract that every later phase reads. It ships no new look.
- Tokens stay in `site_themes.properties` in this phase. Phase 3 moves them into the theme document.
- The font picker must stop accepting free text. A tenant picks an id from a catalog, and that font loads.

## Current state (checked 2026-11-10)

1. `SYSTEM_PROPERTIES_DEFAULTS` holds flat keys: `color.*`, `layout.max.width`, `layout.border.radius`, `shadow.soft`, `shadow.card`, `font.primary`, `font.secondary`, `font.mono`.
2. `cssVariablesBlock` in `src/lib/theme/themeOverrides.ts` emits only `color.`, `layout.`, and `shadow.` keys. It does not emit `font.*`.
3. The site setup wizard (`SiteSetupVisualStep.tsx`) has free-text inputs for `fontPrimary`, `fontSecondary`, and `fontMono`. The value is saved and has no visible effect. The root layout always loads DM Sans and Fraunces (`src/app/layout.tsx`).
4. Each bespoke kind loads its own fonts in a `*FontRoot.tsx` with `next/font` (Nago: Oswald, Outfit; Liora: Cormorant Garamond, Jost; Mi Mundo: Fraunces, Nunito, Caveat; Mozarthitos: Baloo 2, DM Sans; Matiss: Fraunces, Nunito; Espacio Zenit: Bebas Neue, Cormorant Garamond, Pacifico, Plus Jakarta Sans, and 3 local OTF files).
5. Bespoke CSS defines its own variables (`--nago-ink`, `--nago-bg`, …). The 6 landing CSS files declare 248 custom properties. TSX files reference bespoke variables 509 times.
6. `src/lib/theme/contrastRatio.ts` already computes WCAG ratios for `#RRGGBB`.

## Decision

### 1. Token contract `DesignTokensV1`

A pure module `src/lib/design-tokens/` (no Supabase, no React).

| Group | Tokens | Property key prefix |
|---|---|---|
| Color pairs | `background`/`foreground`, `surface`/`foreground`, `primary`/`primary.foreground`, `secondary`/`secondary.foreground`, `accent`/`accent.foreground`, `muted`/`muted.foreground`, `border`, `success`, `warning`, `error`, `info` | `color.` (existing keys, unchanged) |
| Typography | `font.heading` id, `font.body` id, `type.scale` (`compact`, `standard`, `generous`), `type.heading.weight` | `font.`, `type.` |
| Shape | `radius.control`, `radius.card` | `radius.` |
| Space | `space.density` (`compact`, `standard`, `airy`) | `space.` |
| Elevation | `shadow.soft`, `shadow.card` (existing) | `shadow.` |
| Motion | `motion.level` (`none`, `subtle`, `expressive`) | `motion.` |

Rules:

- `color.*` values are `#RRGGBB`. Other formats fail with `token_invalid_color`.
- Enum tokens accept only the listed values.
- Every token has a default in `SYSTEM_PROPERTIES_DEFAULTS`. The defaults reproduce the current Golden look.
- `layout.border.radius` stays as an alias. If `radius.*` is empty, it reads `layout.border.radius`.
- `type.scale`, `space.density`, and `motion.level` map to a fixed set of CSS values in code. A tenant picks a level. It does not type pixel values.

### 2. CSS builder

- `buildDesignTokenCss(tokens)` returns the `:root` body with `--ds-*` names (`--ds-color-primary`, `--ds-radius-card`, `--ds-font-heading`, …).
- It also emits the current names (`--color-primary`, `--layout-border-radius`) as aliases. Existing components keep working without edits.
- The builder reuses `sanitizeCssValue`. Output order is stable for snapshot tests.
- `cssRootBlock` calls the new builder. `src/app/layout.tsx` and `plantilla/[kind]/page.tsx` keep the same call site.

### 3. Contrast validator

- `validateDesignTokens(tokens)` returns `{ ok: true }` or a list of issues `{ code, token, pair?, ratio? }`.
- It checks each color pair above at 4.5:1. It checks `border` against `background` at 3:1.
- Codes: `contrast_below_aa`, `token_invalid_color`, `token_invalid_value`, `font_not_in_catalog`.
- Phase 1 uses the validator in the wizard save action and in a fleet report script. Phase 3 makes it the publish gate.
- Existing tenants with a failing pair are not blocked in phase 1. The report lists them.

### 4. Font catalog

- `src/lib/design-tokens/fontCatalog.ts` lists font ids, family names, category (`sans`, `serif`, `display`, `script`, `mono`), and allowed weights. Data only.
- `src/components/atoms/fonts/catalogFonts.ts` declares each catalog font once with `next/font/google` or `next/font/local`: `display: "swap"`, `adjustFontFallback: true`, `preload: false`. Fonts are self-hosted by `next/font` at build time.
- A browser downloads a font file only when an element uses it. Declaring the catalog adds `@font-face` rules, not downloads.
- The root layout resolves `font.heading` and `font.body` to catalog entries. It sets `--font-display` and `--font-sans` from them and adds their class names to `<html>`.
- First catalog: every family the 6 bespoke clients and the root layout use today (DM Sans, Fraunces, Oswald, Outfit, Cormorant Garamond, Jost, Nunito, Caveat, Baloo 2, Bebas Neue, Pacifico, Plus Jakarta Sans, JetBrains Mono). The 3 Espacio Zenit OTF files become owned catalog entries (`owner: "espaciozenit"`).
- `*FontRoot.tsx` files import fonts from the catalog module instead of declaring their own. Their look does not change. Phase 4 removes them.

### 5. Migration of stored values

- A new migration maps `font.primary` and `font.secondary` free text to catalog ids when the name matches a catalog family (case-insensitive). It writes `font.body` and `font.heading`.
- Unknown names stay untouched. The fleet report lists them as `font_not_in_catalog`.
- The migration is additive. It does not delete the old keys (rule 21).
- `THEME_OVERRIDE_KEY_PREFIXES` gains `type.`, `radius.`, `space.`, `motion.`.

### 6. Wizard

- `SiteSetupVisualStep` replaces the three free-text font inputs with two selects from the catalog (heading and body). Owned entries show only to their owner tenant.
- The save action runs `validateDesignTokens`. A failure returns the code and the token name. The UI shows the dictionary sentence for that code (rule 50).
- `font.mono` leaves the wizard. It stays a system default.

## Options considered

| Option | Why rejected |
|---|---|
| Load any Google Font by name at runtime | Third-party request on each page, no `next/font` self-hosting, LCP risk, no license review. |
| Font upload per tenant | License risk and support cost. The user chose a curated catalog. |
| Raw pixel values for scale and spacing | Admins can break layouts. Levels keep sites coherent. |
| Move tokens to a new table now | Phase 3 owns storage. Phase 1 stays a non-breaking contract change. |
| Rename all `--color-*` usages to `--ds-*` now | Thousands of edits with no user value. Aliases keep both names. |

## Surfaces (Web vs PWA)

- **Public site and PWA (Tier A):** no layout change. Fonts and CSS variables come from the same `<html>` root for web and PWA trees. Existing tests for `PublicPwaTabBar`, `PublicInstalledTopBar`, `NagoFontRoot`, and the register surfaces must stay green.
- **Site setup wizard (Tier B):** desktop-only. Two font selects replace three inputs.
- **CentroListo platform pages:** unchanged. `loadPulsarPlatformProperties` keeps its own properties.

## Plan outline

1. TDD `DesignTokensV1` schema, defaults, and parser.
2. TDD `buildDesignTokenCss` with `--ds-*` names and aliases. Snapshot the Golden default output.
3. TDD `validateDesignTokens` with the 4 codes.
4. Font catalog data and the `next/font` declaration module. Root layout wiring.
5. Point the 6 `*FontRoot.tsx` files at catalog entries.
6. SQL migration for font ids, `masterdb.sql` update, apply with `npm run sql:apply-migration:all-tenants:pg`.
7. Wizard selects, save validation, dictionary sentences in `en.json`, `es.json`, `pt.json`.
8. Fleet report script: tenants with `contrast_below_aa` or `font_not_in_catalog`.

A full plan goes to `docs/superpowers/plans/2026-11-10-design-tokens-v1.md` after approval.

## Risks and mitigation

| Risk | Mitigation |
|---|---|
| A tenant sees a font change after the migration | Map only exact family matches. The root layout falls back to DM Sans and Fraunces when the id is empty. |
| More `@font-face` rules on every page | Rules are small and `preload: false`. Lighthouse on Golden and Nago before and after (rule 06). |
| An alias collides with a bespoke variable | Bespoke files use their own prefixes (`--nago-*`). Phase 1 does not rename them. |
| Existing tenants fail contrast | Phase 1 reports, it does not block old themes. New wizard saves are validated. |

## Observability

- Wizard save failure: `logServerWarn` with scope `siteSetup.saveVisual` and the validation code.
- `recordSystemAudit` on wizard save stays as it is today.

## Definition of done

- `DesignTokensV1`, parser, CSS builder, validator, and font catalog exist with tests at 90% or more.
- The Golden default CSS snapshot matches today's variables plus the new `--ds-*` set.
- The root layout loads the tenant fonts from `font.heading` and `font.body`.
- The wizard saves catalog ids only and shows a coded sentence on a validation failure.
- The migration ran on all tenants through the apply command.
- The fleet report runs and lists issues per tenant.
- No visual change on the 6 bespoke clients. Manual QA (user) confirms.

## Out of scope

- Theme document table, publish, rollback (phase 3).
- Section variants and the registry (phase 2).
- Removing bespoke CSS variables and `*FontRoot.tsx` files (phase 4).
- The slug guard (phase 5).

## Fleet report (first run)

Command: `npm run report:design-tokens` on 2026-11-11. Exit code 0.

The script prints a line only when the active theme has an issue. These four lines were the full report:

```text
liora contrast_below_aa color.secondary color.secondary.foreground 4.38
liora contrast_below_aa color.muted color.muted.foreground 2.02
mimundo contrast_below_aa color.secondary color.secondary.foreground 4.38
matiss contrast_below_aa color.border color.background 1.54
```

espaciozenit, golden, mozarthitos, and nago printed no line. Migration `273_design_tokens_font_ids.sql` applied on espaciozenit, golden, liora, mimundo, mozarthitos, nago (`public`) and matiss (`tenant_matiss`).

## Manual QA (user)

- Open Golden, Nago, Liora, Mi Mundo, Mozarthitos, Espacio Zenit, and Matiss home and `/register` on desktop and phone. Fonts and colors look the same as before.
- In the site setup wizard, pick a new heading font, save, and confirm the public site uses it.
- Save a palette with low contrast and confirm the coded error sentence.
