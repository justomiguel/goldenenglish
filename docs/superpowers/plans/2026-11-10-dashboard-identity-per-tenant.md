# Phase 10 — Dashboard identity per tenant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-11-10-dashboard-identity-per-tenant-design.md`
**Depends on:** phases 1, 3, and 7 (`install.theme` for the PWA top bar). The editor section needs phase 6.

**Goal:** Each tenant's dashboards show its own logo, accent, and fonts, with AA contrast and readable state colors on every role.

**Architecture:** A pure `deriveAppTokens` builds an `app` token group from the site tokens, with neutral fallbacks and AA checks. A new dashboard layout inlines a `.ge-app` CSS block that re-emits the current `--color-*` names from `app` tokens, so existing components need no edits. A scan test blocks fixed colors in dashboard and PWA components.

**Tech Stack:** Next.js nested layouts, phase 1 CSS builder, catalog fonts, Vitest.

## Global Constraints

- `app` tokens: `surface`, `panel`, `text`, `textMuted`, `accent`, `accentText`, `sidebar`, `sidebarText`, `focus`, `radius` (cap 12 px), `density` (`compact | standard`, default `compact`), `font.body`, `font.heading`, `sidebarStyle` (`brand | neutral`).
- Saturation rule: site background saturation above 15% → derived neutral `app.surface`.
- `app.font.body` must be a `sans` catalog entry. Otherwise use the default sans.
- `app.focus` at 3:1 on `surface` and `panel`. Text pairs at 4.5:1.
- State colors (`success`, `warning`, `error`, `info`) stay system defaults inside `.ge-app`.
- `app.*` is staff-only by default in `editableBy`.
- Tier A (student, parent): Web and PWA trees both get the scope, the logo, and the fonts. Run `tierADashboard*`, `*Pwa*`, and `*Mobile*` tests.
- Logo links to the dashboard home (rule 47).
- Scan test covers `src/components/dashboard/**` and `src/components/pwa/**`.

## File map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/lib/design-tokens/deriveAppTokens.ts` | Pure derivation and fallbacks. |
| Create | `src/lib/design-tokens/colorSaturation.ts` | Pure HSL saturation of `#RRGGBB`. |
| Modify | `src/lib/design-tokens/validateDesignTokens.ts` | `app.*` pair checks. |
| Create | `src/lib/design-tokens/buildAppScopeCss.ts` | `.ge-app { … }` body. |
| Create | `src/app/[locale]/dashboard/layout.tsx` | Shared dashboard layout: style block, scope wrapper, font classes. |
| Create | `src/components/organisms/DashboardIdentityRoot.tsx` | Server wrapper `div.ge-app`. |
| Modify | `AdminDashboardShell`, `TeacherDashboardShell`, `AssistantDashboardShell`, sidebars, the parent and student PWA top bar | Tenant logo. |
| Modify | The 18 files with fixed colors | Tokens. |
| Modify | Phase 6 Identity tab | Dashboard section. |
| Modify | `src/dictionaries/{en,es,pt}.json` | Logo `alt` fallback, editor labels. |
| Test | `src/__tests__/lib/design-tokens/{deriveAppTokens,buildAppScopeCss,colorSaturation}.test.ts`, `src/__tests__/app/dashboardLayout.test.tsx`, `src/__tests__/components/dashboardNoFixedColors.test.ts`, shell tests | |

## Tasks

### Task 1: App tokens

**Produces:**

```ts
export interface AppTokens {
  surface: string; panel: string; text: string; textMuted: string;
  accent: string; accentText: string; sidebar: string; sidebarText: string;
  focus: string; radius: string; density: "compact" | "standard";
  font: { body: string; heading: string };
  sidebarStyle: "brand" | "neutral";
}
export function deriveAppTokens(tokens: DesignTokensV1, overrides: Partial<Record<string, string>>): AppTokens;
export function hexSaturation(hex: string): number; // 0..1
```

- [ ] Red: `colorSaturation.test.ts`. `#808080` → 0. `#ff0000` → 1. Invalid input → 0.
- [ ] Red: `deriveAppTokens.test.ts`.
  - Golden defaults keep the Golden accent and white surface.
  - A saturated background (`#ffe9c7`) gives a neutral surface with saturation ≤ 0.15.
  - A serif body font gives the default sans for `font.body`.
  - `sidebarStyle: "neutral"` gives a neutral sidebar.
  - A pale accent gives an `accentText` that passes AA, or the neutral pair.
  - `radius` `1.5rem` gives `12px`.
- [ ] Red: `validateDesignTokens.app.test.ts`. An override `app.sidebarText` with low contrast fails with `contrast_below_aa` and `token: "app.sidebarText"`.
- [ ] Green.

### Task 2: Scope CSS and dashboard layout

**Produces:** `export function buildAppScopeCss(app: AppTokens): string;`

- [ ] Red: `buildAppScopeCss.test.ts`.
  - The output starts with `.ge-app {`.
  - It sets `--color-background`, `--color-surface`, `--color-foreground`, `--color-primary`, `--color-primary-foreground`, `--layout-border-radius`, and `--ds-*` twins.
  - It sets no `--color-error`, `--color-success`, `--color-warning`, or `--color-info`.
  - The output is ≤ 2 KB.
- [ ] Red: `dashboardLayout.test.tsx`.
  - The layout renders one `<style>` with the scope and a `div.ge-app` around children.
  - The font classes for `app.font.*` are on the wrapper.
  - Tenant `a` and tenant `b` get different accents.
- [ ] Green. The layout reads `loadPublishedThemeDocument(tenantSlug)`. Fonts come from `CATALOG_FONTS`. The style block uses `sanitizeCssValue` values only.
- [ ] Run the role layout tests under `src/__tests__/app/` and the Tier A dashboard tests. Expect PASS.

### Task 3: Logo in shells

- [ ] Red: one test per shell (admin, teacher, assistant sidebars, the parent and student PWA top bars).
  - The logo `img` uses `app.logo.path` from the brand prop.
  - Its `alt` comes from `app.logo.alt` or the dictionary fallback.
  - The link goes to the role's dashboard home.
  - The PWA top bar background is `install.theme`.
- [ ] Green. Pass the brand from each role layout. Do not fetch inside the shell (rule 03).

### Task 4: Fixed colors

- [ ] List the hits: `rg -n "#[0-9a-fA-F]{3,6}\b|\b(bg|text|border|ring|fill|stroke)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}\b" src/components/dashboard src/components/pwa`. Paste the 18 files into this task as a checklist.
- [ ] Red: `dashboardNoFixedColors.test.ts`. It runs the same patterns on both folders and fails on any hit. The allow list is empty. An inline-style safe-area exception does not apply here.
- [ ] Green. Replace each hit with the matching token (`--color-muted`, `--color-border`, `--color-error`, …). Check hover and focus states (rule 26).
- [ ] Run the tests of every touched component.

### Task 5: Editor section, copy, commit

- [ ] Phase 6 Identity tab: add a Dashboard section with the derived tokens, the `sidebarStyle` toggle, and a preview panel (table, form, badges, the parent PWA home at 390 px). Add `app.*` paths to the staff-only default in `starterDocuments.ts`.
- [ ] Red: `IdentityTab.dashboard.test.tsx`. An admin sees the section read-only. Staff can toggle the sidebar style. The preview shows the AA status in text.
- [ ] Dictionary keys. Run `neutralSpanishCopy.test.ts`.
- [ ] `npx vitest run src/__tests__/lib/design-tokens src/__tests__/app src/__tests__/components`, `npx tsc --noEmit`, `npx eslint`.
- [ ] Changelog row `dashboard-identity`, area `portal`.
- [ ] Commit spec + plan + code. Do not push.

## Manual QA (user)

- Log in as admin, teacher, parent, and student on Golden and Nago, on desktop and the installed PWA. Check the logo, the accent, and the fonts. Check that error and success messages look the same on both.

## Self-review

- Spec sections 1–4 map to tasks 1–5.
- Names from earlier phases: `parseDesignTokens`, `validateDesignTokens`, `CATALOG_FONTS`, `loadPublishedThemeDocument`, `starterDocuments.ts`, `install.theme`.
