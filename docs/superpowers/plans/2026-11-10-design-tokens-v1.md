# Phase 1 — Design tokens v1 and font catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-11-10-design-tokens-v1-design.md`
**Umbrella:** `docs/superpowers/specs/2026-11-10-tenant-design-system-design.md`

**Goal:** Every tenant has one typed token set and picks fonts from a self-hosted catalog. No tenant sees a visual change.

**Architecture:** A pure module `src/lib/design-tokens/` parses flat `site_themes.properties` keys into `DesignTokensV1`, validates them, and builds CSS with `--ds-*` names plus the current names as aliases. `cssRootBlock` delegates to that builder. A catalog module declares each font once with `next/font`, and the root layout picks the tenant fonts by id.

**Tech Stack:** Next.js App Router, `next/font/google`, `next/font/local`, Zod, Vitest, Postgres migration.

## Global Constraints

- Pure modules under `src/lib/design-tokens/` import no Supabase, no React, no Next.
- `color.*` values are `#RRGGBB`. Other formats fail with `token_invalid_color`.
- Enums: `type.scale` = `compact | standard | generous`. `space.density` = `compact | standard | airy`. `motion.level` = `none | subtle | expressive`.
- Contrast: each text pair at 4.5:1. `border` against `background` at 3:1.
- Error codes: `contrast_below_aa`, `token_invalid_color`, `token_invalid_value`, `font_not_in_catalog`.
- Fonts: `display: "swap"`, `adjustFontFallback: true`, `preload: false`. No runtime Google Fonts request.
- The Golden default CSS keeps every current variable with the same value. The `--ds-*` set is added.
- Migrations stay additive (rule 21). Apply with `npm run sql:apply-migration:all-tenants:pg -- <file>` (rule 45).
- Copy in `en.json`, `es.json`, `pt.json`. Spanish in neutral tuteo (rule 40).
- No file over 250 lines (rule 03).

## File map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/lib/design-tokens/designTokensV1.ts` | Types, enum lists, Zod schema. |
| Create | `src/lib/design-tokens/parseDesignTokens.ts` | Flat properties → `DesignTokensV1`, with alias fallbacks. |
| Create | `src/lib/design-tokens/designTokenScales.ts` | Level → fixed CSS values. |
| Create | `src/lib/design-tokens/buildDesignTokenCss.ts` | `:root` body with `--ds-*` and aliases. |
| Create | `src/lib/design-tokens/validateDesignTokens.ts` | Contrast and value checks. |
| Create | `src/lib/design-tokens/fontCatalog.ts` | Font ids, family, category, weights, owner. Data only. |
| Create | `src/components/atoms/fonts/catalogFonts.ts` | One `next/font` declaration per catalog id. |
| Create | `src/lib/design-tokens/resolveTenantFonts.ts` | Font ids → catalog entries with fallback. Pure. |
| Modify | `src/lib/theme/themeOverrides.ts` | `cssRootBlock` calls the new builder. |
| Modify | `src/lib/theme/systemPropertiesDefaults.ts` | New default keys. |
| Modify | `src/types/theming.ts` | Prefixes `type.`, `radius.`, `space.`, `motion.`. |
| Modify | `src/app/layout.tsx` | Fonts from tenant tokens. |
| Modify | 6 `*FontRoot.tsx` | Import from `catalogFonts.ts`. |
| Create | `supabase/migrations/<next>_design_tokens_font_ids.sql` | Map free text to font ids. Next number today: `270`. |
| Modify | `supabase/migrations/masterdb.sql` | Comment the new keys. |
| Modify | `siteSetupCompletionSchema.ts`, `buildSiteSetupOverrideMap.ts`, `loadSiteSetupCurrentValues.ts`, `useSiteSetupWizardState.ts`, `SiteSetupVisualStep.tsx`, `siteSetupActions.ts`, `submitSiteSetupWizardClient.ts` | Two font selects and validation. |
| Create | `src/lib/design-tokens/designTokenIssueMessage.ts` | Code → dictionary sentence. |
| Create | `scripts/report-design-token-fleet.mjs` | Fleet report. |
| Modify | `src/dictionaries/{en,es,pt}.json` | Wizard labels and error sentences. |
| Test | `src/__tests__/lib/design-tokens/*.test.ts`, `src/__tests__/components/dashboard/admin/site-setup/SiteSetupVisualStep.test.tsx`, `src/__tests__/app/siteSetupActions.designTokens.test.ts` | |

## Tasks

### Task 1: Token contract and parser

**Produces:**

```ts
export const TYPE_SCALES = ["compact", "standard", "generous"] as const;
export const SPACE_DENSITIES = ["compact", "standard", "airy"] as const;
export const MOTION_LEVELS = ["none", "subtle", "expressive"] as const;
export const COLOR_TOKEN_KEYS = [
  "background", "foreground", "surface", "primary", "primary.foreground",
  "secondary", "secondary.foreground", "accent", "accent.foreground",
  "muted", "muted.foreground", "border", "success", "warning", "error", "info",
] as const;
export type ColorTokenKey = (typeof COLOR_TOKEN_KEYS)[number];
export interface DesignTokensV1 {
  version: 1;
  color: Record<ColorTokenKey, string>;
  font: { heading: string; body: string };
  type: { scale: TypeScale; headingWeight: 400 | 500 | 600 | 700 | 800 };
  radius: { control: string; card: string };
  space: { density: SpaceDensity };
  shadow: { soft: string; card: string };
  motion: { level: MotionLevel };
}
export function parseDesignTokens(properties: ThemeProperties): DesignTokensV1;
```

- [ ] Red: `parseDesignTokens.test.ts`.
  - `SYSTEM_PROPERTIES_DEFAULTS` parses to Golden values (`font.heading` = `fraunces`, `font.body` = `dm-sans`).
  - An empty `radius.card` reads `layout.border.radius`.
  - An empty `font.heading` reads the catalog id that matches `font.secondary` case-insensitive. An unknown name falls back to the default id.
  - An unknown enum value falls back to the default. The parser never throws. The validator reports the issue.
- [ ] Run `npx vitest run src/__tests__/lib/design-tokens/parseDesignTokens.test.ts`. Expect FAIL (module missing).
- [ ] Green: `designTokensV1.ts`, `parseDesignTokens.ts`. Add defaults to `SYSTEM_PROPERTIES_DEFAULTS`: `font.heading: "fraunces"`, `font.body: "dm-sans"`, `type.scale: "standard"`, `type.heading.weight: "600"`, `radius.control: "0.75rem"`, `radius.card: "0.75rem"`, `space.density: "standard"`, `motion.level: "subtle"`. Add any missing color pair defaults with the value the Golden CSS uses today.
- [ ] Add `type.`, `radius.`, `space.`, `motion.` to `THEME_OVERRIDE_KEY_PREFIXES`. Run `themeOverrides.test.ts` and `loadEffectiveProperties.test.ts`. Expect PASS.

### Task 2: CSS builder with aliases

**Consumes:** `DesignTokensV1`, `sanitizeCssValue`.
**Produces:**

```ts
export const DESIGN_TOKEN_SCALE_CSS: {
  type: Record<TypeScale, { base: string; ratio: string }>;
  space: Record<SpaceDensity, { unit: string; section: string }>;
  motion: Record<MotionLevel, { duration: string; ease: string }>;
};
export function buildDesignTokenCss(tokens: DesignTokensV1, properties: ThemeProperties): string;
```

- [ ] Red: `buildDesignTokenCss.test.ts`.
  - Output for the Golden defaults contains every line that `cssVariablesBlock(SYSTEM_PROPERTIES_DEFAULTS)` emits today. Assert line by line against a fixture built from the old function, so the alias set cannot drift.
  - Output contains `--ds-color-primary`, `--ds-radius-card`, `--ds-font-heading`, `--ds-type-base`, `--ds-space-unit`, `--ds-motion-duration`.
  - `--ds-font-heading` is `var(--font-catalog-fraunces)`. It is not a family string.
  - `motion.level: none` emits `--ds-motion-duration: 0ms`.
  - A value with `;` is skipped. Order is stable (`toMatchInlineSnapshot`).
- [ ] Run the test. Expect FAIL.
- [ ] Green: `designTokenScales.ts`, `buildDesignTokenCss.ts`. Keep `cssVariablesBlock` as the alias emitter and append the `--ds-*` lines.
- [ ] Change `cssRootBlock(properties)` to `:root {\n${buildDesignTokenCss(parseDesignTokens(properties), properties)}\n}`. Run `themeOverrides.test.ts`, `loadActiveTheme.test.ts`, and `src/__tests__/app/layout*.test.tsx`. Expect PASS.

### Task 3: Validator

**Produces:**

```ts
export type DesignTokenIssueCode =
  | "contrast_below_aa" | "token_invalid_color" | "token_invalid_value" | "font_not_in_catalog";
export interface DesignTokenIssue {
  code: DesignTokenIssueCode;
  token: string;
  pair?: string;
  ratio?: number;
}
export function validateDesignTokens(
  properties: ThemeProperties,
  options: { tenantSlug: string | null },
): { ok: true } | { ok: false; issues: DesignTokenIssue[] };
```

- [ ] Red: `validateDesignTokens.test.ts`.
  - Golden defaults: `{ ok: true }`.
  - `color.primary: "#ffff00"` with white `primary.foreground`: issue `contrast_below_aa`, `token: "color.primary"`, `pair: "color.primary.foreground"`, ratio rounded to 2 decimals.
  - `border` `#eeeeee` on white: `contrast_below_aa` at the 3:1 threshold.
  - `color.accent: "rgb(1,2,3)"`: `token_invalid_color`.
  - `space.density: "huge"`: `token_invalid_value`.
  - `font.heading: "comic-sans"`: `font_not_in_catalog`.
  - An owned font id (`espaciozenit-*`) passes for `tenantSlug: "espaciozenit"` and fails for `"golden"` with `font_not_in_catalog`.
- [ ] Run. Expect FAIL. Green with `contrastRatio.ts`. Run. Expect PASS.

### Task 4: Font catalog and root layout

**Produces:**

```ts
export type FontCategory = "sans" | "serif" | "display" | "script" | "mono";
export interface FontCatalogEntry {
  id: string;               // "dm-sans"
  family: string;           // "DM Sans"
  category: FontCategory;
  weights: readonly number[];
  owner: string | null;     // null = open to every tenant
}
export const FONT_CATALOG: readonly FontCatalogEntry[];
export function findFontByFamily(name: string): FontCatalogEntry | null;
export function isFontAllowedForTenant(id: string, tenantSlug: string | null): boolean;
// catalogFonts.ts
export const CATALOG_FONTS: Record<string, { className: string; variable: string }>;
// resolveTenantFonts.ts
export function resolveTenantFonts(tokens: DesignTokensV1): { heading: string; body: string };
```

- [ ] Red: `fontCatalog.test.ts`.
  - The catalog has the 13 open families from the spec and the 3 Espacio Zenit local entries with `owner: "espaciozenit"`.
  - Ids are unique and kebab-case.
  - `findFontByFamily("dm sans")` returns `dm-sans`.
  - Every catalog id has a key in `CATALOG_FONTS`. Mock `next/font/google` and `next/font/local` in the test so each loader returns `{ className, variable }`.
- [ ] Red: `resolveTenantFonts.test.ts`. An unknown id resolves to `dm-sans` for the body and `fraunces` for the heading.
- [ ] Green: `fontCatalog.ts`, `catalogFonts.ts` (variable name `--font-catalog-<id>`, `preload: false`), `resolveTenantFonts.ts`. Move the Espacio Zenit OTF `src` paths from `EspacioZenitFontRoot.tsx` into the local entries.
- [ ] Modify `src/app/layout.tsx`.
  - Keep `--font-sans` and `--font-display` as variable names.
  - Set them in the theme `<style>` to `var(--font-catalog-<body>)` and `var(--font-catalog-<heading>)`.
  - Add `CATALOG_FONTS[heading].variable` and `CATALOG_FONTS[body].variable` to `<html className>`.
  - Remove the direct `DM_Sans` / `Fraunces` declarations.
- [ ] Run the layout tests and `src/__tests__/components/**/PublicPwaTabBar*.test.tsx`. Expect PASS.

### Task 5: Bespoke font roots read the catalog

- [ ] For each of `NagoFontRoot`, `LioraFontRoot`, `MiMundoFontRoot`, `MozarthitosFontRoot`, `MatissFontRoot`, `EspacioZenitFontRoot`: replace the local `next/font` calls with `CATALOG_FONTS[id].variable`. Keep each root's own CSS variable names (`--nago-font-*`). Map them in the root CSS to `var(--font-catalog-<id>)`.
- [ ] Run the existing `*FontRoot` tests. Add one assertion per root: the rendered class list contains the catalog variable classes.
- [ ] Run `npx vitest run src/__tests__/components/landing`. Expect PASS.

### Task 6: Migration for stored font names

- [ ] Write `supabase/migrations/270_design_tokens_font_ids.sql` (use the next free number at execution).
  - For each `public.site_themes` row, when `properties->>'font.secondary'` matches a catalog family case-insensitive and `font.heading` is absent, set `font.heading` to the id. Same for `font.primary` → `font.body`.
  - The mapping is a `values` list of the 13 open families. Owned entries are not mapped.
  - It uses `jsonb_set` / `||` only. It deletes no key.
  - It is idempotent: a second run changes 0 rows.
- [ ] Add a comment block for the new keys to `masterdb.sql`.
- [ ] Add `src/__tests__/supabase/designTokensFontIdsMigration.test.ts`. Read the SQL file and assert: no `delete`, no `drop`, every family in `FONT_CATALOG` with `owner: null` appears in the `values` list.
- [ ] Apply: `npm run sql:apply-migration:all-tenants:pg -- supabase/migrations/270_design_tokens_font_ids.sql`. Record the per-tenant result lines in the commit message body.

### Task 7: Wizard selects and save validation

**Consumes:** `FONT_CATALOG`, `isFontAllowedForTenant`, `validateDesignTokens`.
**Produces:** wizard fields `fontHeading`, `fontBody`. Action result `{ ok: false; code: DesignTokenIssueCode; token: string }`.

- [ ] Red: `SiteSetupVisualStep.test.tsx`.
  - Two selects with dictionary labels. No `fontMono` input.
  - An owned font shows only when `tenantSlug` is the owner.
  - The error alert for `contrast_below_aa` shows the sentence and `Code: contrast_below_aa`.
  - An unknown code shows the raw code (rule 50).
- [ ] Red: `siteSetupActions.designTokens.test.ts`.
  - A low-contrast palette returns `{ ok: false, code: "contrast_below_aa", token: "color.primary" }`.
  - The action logs `logServerWarn` with scope `siteSetup.saveVisual` and the code.
  - It does not write the theme row.
  - A valid save writes `font.heading` and `font.body`.
- [ ] Green.
  - Schema: replace `fontPrimary`, `fontSecondary`, `fontMono` with `fontHeading` and `fontBody`, both enums of catalog ids.
  - Map builder: write `font.heading` and `font.body`.
  - Current values loader: read the parsed tokens.
  - Hook state and step UI.
  - Action: run `validateDesignTokens` on the merged properties before the write.
  - Add `designTokenIssueMessage.ts` and the dictionary keys under `dashboard.siteSetup.designTokenIssue.*` for the 4 codes plus `unknown`, with `{token}` and `{code}` placeholders.
- [ ] Run the wizard tests, `src/__tests__/i18n/neutralSpanishCopy.test.ts`, and the dictionary shape test. Expect PASS.

### Task 8: Fleet report

- [ ] Write `scripts/report-design-token-fleet.mjs`.
  - It reads targets like the apply command (Pulsar `platform_tenants` or `TENANTS_CONFIG_JSON`).
  - Per tenant, it reads the active `site_themes.properties` and runs `validateDesignTokens`. Import it through `tsx`, like the other TS scripts.
  - It prints one line per issue: `slug code token pair ratio`. Exit code 0. The report never blocks.
- [ ] Add `npm run report:design-tokens` to `package.json`.
- [ ] Add a unit test for the pure formatter `formatDesignTokenFleetLine` in `src/lib/design-tokens/formatDesignTokenFleetLine.ts`.
- [ ] Run the script once. Paste the summary into the spec under a new section `Fleet report (first run)`.

### Task 9: Gate and commit

- [ ] `npx vitest run src/__tests__/lib/design-tokens src/__tests__/lib/theme src/__tests__/components/dashboard/admin/site-setup`.
- [ ] `npx tsc --noEmit` and `npx eslint` on the touched files.
- [ ] Changelog row (rule 39): the wizard font picker changes for staff. Add an insert in a new `supabase/pulsar-migrations/` file, `area: admin`, id `site-setup-font-catalog`.
- [ ] Commit spec + plan + code + migration together. Message: `feat(design-tokens): v1 token contract and font catalog`. Do not push.
- [ ] Hand the Manual QA list from the spec to the user.

## Self-review

- Spec sections 1–6 map to tasks 1–7. Observability maps to task 7. The fleet report maps to task 8.
- Names used across tasks: `parseDesignTokens`, `buildDesignTokenCss`, `validateDesignTokens`, `FONT_CATALOG`, `CATALOG_FONTS`, `resolveTenantFonts`, `DesignTokenIssueCode`.
