# Phase 2 — Section variant registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-11-10-section-variant-registry-design.md`
**Depends on:** phase 1 (`DesignTokensV1`, `--ds-*` variables).

**Goal:** Every landing section is a versioned variant in a registry. Generic tenants render through the registry with no visual change.

**Architecture:** Pure registry data and resolution live in `src/lib/design-variants/`. Components live in `src/variants/<slot>/<name>/v<major>/`. A Server Component renderer resolves each section, loads only the pinned variant through `import()`, and uses `SurfaceMountGate` for variants that ship a PWA tree. Each variant major has fixtures and a screenshot baseline.

**Tech Stack:** Next.js App Router, React Server Components, `next/dynamic`, Zod, Vitest, Playwright `toHaveScreenshot`.

## Global Constraints

- Identity is `id` + `major`. `patch` is metadata only.
- Variants read color, font, radius, and space only through `--ds-*`. No hex values. No tenant slug in shared variants.
- `interactive: true` requires `pwa`.
- Codes: `variant_version_missing`, `variant_not_available`, `variant_props_invalid`.
- Render failure log: `[ge:server]`, scope `designVariants.render`, fields `code`, `tenantSlug`, `sectionId`, `variantId`, `major`.
- Preview route returns 404 unless `GE_DEV_TARGET` is `e2e` or `local`. It is `noindex` and not in the sitemap.
- Viewports: 1280 px and 390 px. Baselines in `e2e/__screenshots__/variants/`.
- One registry file per slot. No file over 250 lines.
- Zero visual change for generic tenants. Bespoke kinds are untouched (phase 4).

## File map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/lib/design-variants/sectionVariant.ts` | `SectionVariant`, `SectionSlot`, `VariantEditorField`, `ThemeSection` types. |
| Create | `src/lib/design-variants/registry/{hero,schedule,band,close,nav,footer,contact}.ts` | Variant entries per slot. |
| Create | `src/lib/design-variants/registry/index.ts` | `ALL_VARIANTS`. |
| Create | `src/lib/design-variants/variantRegistry.ts` | `getVariant`, `latestMajor`, `variantsForTenant`, `resolveSection`. |
| Create | `src/lib/design-variants/genericKindToSections.ts` | Generic kind → section list. Replaces `genericLandingComposition`. |
| Create | `src/variants/<slot>/<name>/v1/{Web.tsx,props.ts,fixtures.ts,index.ts}` | 24 shared variants moved from `src/components/organisms/generic-landing/`. |
| Create | `src/components/organisms/SectionListRenderer.tsx` | Server renderer. |
| Create | `src/components/organisms/VariantSurfaceEntry.tsx` | Client switch Web / PWA. |
| Modify | `src/components/organisms/LandingMainSectionsGeneric.tsx` | Calls `SectionListRenderer`. |
| Delete after move | `src/lib/landing/genericLandingComposition.ts` | Callers move to `genericKindToSections`. |
| Create | `src/app/[locale]/plantilla/variante/[id]/[major]/page.tsx` | Preview route. |
| Create | `e2e/visual-variants.spec.ts` | Screenshots per variant, fixture, viewport. |
| Create | `scripts/report-variant-fleet.mjs` | Tenants per variant and major. |
| Test | `src/__tests__/lib/design-variants/*.test.ts`, `src/__tests__/components/organisms/SectionListRenderer.test.tsx`, `src/__tests__/app/plantillaVariantePage.test.tsx` | |

## Tasks

### Task 1: Contract types and registry API

**Produces:**

```ts
export const SECTION_SLOTS = ["hero","band","schedule","team","faq","contact","close","nav","footer","page"] as const;
export type SectionSlot = (typeof SECTION_SLOTS)[number];
export type VariantEditorField =
  | { key: string; kind: "text" | "longText" | "image" | "toggle"; labelKey: string }
  | { key: string; kind: "select"; labelKey: string; options: readonly string[] }
  | { key: string; kind: "list"; labelKey: string; itemFields: readonly VariantEditorField[] };
export interface ThemeSection { id: string; variantId: string; major: number; props: unknown }
export type ResolveSectionResult<P = unknown> =
  | { ok: true; variant: SectionVariant<P>; props: P }
  | { ok: false; code: "variant_version_missing" | "variant_not_available" | "variant_props_invalid" };
export function getVariant(id: string, major: number): SectionVariant<unknown> | null;
export function latestMajor(id: string): number | null;
export function variantsForTenant(tenantSlug: string | null, slot?: SectionSlot): SectionVariant<unknown>[];
export function resolveSection(section: ThemeSection, tenantSlug: string | null): ResolveSectionResult;
```

- [ ] Red: `variantRegistry.test.ts` with an injected fake registry (`createVariantRegistry(entries)`). Cases:
  - An unknown major returns `variant_version_missing`.
  - A variant owned by `liora` resolves for `liora` and returns `variant_not_available` for `golden` and for `null`.
  - Bad props return `variant_props_invalid`.
  - `latestMajor` returns the highest major.
  - `variantsForTenant` returns shared plus own owned entries.
- [ ] Red: `registryIntegrity.test.ts` on the real `ALL_VARIANTS`. `id` + `major` is unique. Each `interactive` entry has `pwa`. Each `editorFields` key exists in `propsSchema`. Each `labelKey` exists in `en.json`.
- [ ] Green: `sectionVariant.ts`, `variantRegistry.ts`, empty slot registries.

### Task 2: Move the generic layouts into variants

One commit per slot group. Each step keeps `LandingMainSectionsGeneric.test.tsx` green.

- [ ] Hero: move the 5 `GenericLandingHero` layouts to `src/variants/hero/{bleed,split,masthead,stage,title}/v1/Web.tsx`. Derive `props.ts` from the `SKIN_FIELDS` entries the hero reads. Add `fixtures.ts` with 2 prop sets. Register in `registry/hero.ts` with `major: 1, patch: 0, interactive: false`.
- [ ] Schedule: the 5 `GenericLandingDay` layouts → `schedule.{rows,rule,prospectus,recital,steps}`.
- [ ] Band: the 5 `GenericLandingBands` layouts → `band.{alternate,cluster,ruled,paper,breaks}`.
- [ ] Close: the 5 `GenericLandingClose` layouts → `close.{paper,quiet,narrow,stage,under}`.
- [ ] Nav, footer, contact: `nav.generic` (`interactive: true`, with `Pwa.tsx` from the current mobile branch), `footer.generic`, `contact.form` (`interactive: true`, with `Pwa.tsx`), `contact.map`.
- [ ] Replace hex literals and `--color-*` reads in moved files with `--ds-*`. Split `genericLanding.module.css` per variant folder.
- [ ] Per slot: add a unit test that renders each variant with each fixture and asserts the main heading text. Reuse the mocks in `LandingMainSectionsGeneric.test.tsx`, copied into the new file (rule 30).

### Task 3: Renderer and surface entry

**Produces:**

```tsx
export async function SectionListRenderer(props: {
  sections: readonly ThemeSection[];
  tenantSlug: string | null;
  locale: Locale;
}): Promise<JSX.Element>;
export function VariantSurfaceEntry(props: { variantKey: string; props: unknown }): JSX.Element; // "use client"
```

- [ ] Red: `SectionListRenderer.test.tsx`.
  - A valid list renders in order.
  - A section with a bad major is skipped and `logServerWarn` is called once with scope `designVariants.render`, code `variant_version_missing`, and the ids.
  - The other sections still render.
  - A variant with `pwa` renders `VariantSurfaceEntry`.
- [ ] Red: `VariantSurfaceEntry.test.tsx`. Mock `useAppSurface`: `web-desktop` renders Web, `pwa-mobile` renders Pwa, and only one tree mounts.
- [ ] Green. `VariantSurfaceEntry` holds a static map `variantKey → { web: dynamic(...), pwa: dynamic(...) }` generated in `src/variants/clientEntries.ts`. A registry integrity test checks that each `interactive` variant has a map entry.

### Task 4: Generic tenants render through the registry

**Produces:** `export function genericKindToSections(kind: GenericInstituteKind): ThemeSection[];`

- [ ] Red: `genericKindToSections.test.ts`. For each of the 20 kinds, the hero, day, bands, and close variant ids equal the layouts `genericLandingComposition` returns today. Build the expectation table from the old function before you delete it.
- [ ] Green, then switch `LandingMainSectionsGeneric.tsx` to `SectionListRenderer`. Props come from `resolveSkin` output, mapped by section id.
- [ ] Move the other callers (`src/types/theming.ts`, `loadActiveTheme.ts`, `fleetSiteReview.ts`) to the new function. Delete `genericLandingComposition.ts` and its test. Move its test cases into the new test.
- [ ] Run `npx vitest run src/__tests__/components/LandingMainSectionsGeneric.test.tsx src/__tests__/lib/landing src/__tests__/lib/theme`. Expect PASS.

### Task 5: Preview route and visual regression

- [ ] Red: `plantillaVariantePage.test.tsx`. `notFound()` is called when `GE_DEV_TARGET` is unset or `production`. Metadata has `robots: { index: false, follow: false }`. An unknown id calls `notFound()`.
- [ ] Green: the page reads `?fixture=<n>`, injects the Golden default token CSS, and renders the variant in a fixed-width frame.
- [ ] Write `e2e/visual-variants.spec.ts`. Loop `ALL_VARIANTS` × fixtures × `[1280, 390]`. Use `expect(page).toHaveScreenshot(\`${id}@${major}-${fixture}-${width}.png\`, { maxDiffPixelRatio: 0.001 })`. Disable animations.
- [ ] Generate baselines: `npx playwright test e2e/visual-variants.spec.ts --update-snapshots` on the isolated stack. Commit them.
- [ ] Confirm `test:e2e:precommit` picks up the new spec through the pass cache (rule 34).
- [ ] Confirm `src/app/sitemap.ts` does not list `/plantilla/variante`. Add an assertion to the sitemap test.

### Task 6: Fleet report

- [ ] Pure formatter `src/lib/design-variants/variantFleetSummary.ts`: `(rows: { slug: string; sections: ThemeSection[] }[]) => Map<string, string[]>`, keyed `id@major`. Unit test.
- [ ] `scripts/report-variant-fleet.mjs`. Targets as in the apply command. Source in this phase: the tenant `template_kind` → `genericKindToSections`. Bespoke kinds print as `bespoke:<kind>`.
- [ ] `npm run report:variants` in `package.json`.

### Task 7: Gate and commit

- [ ] `npx vitest run src/__tests__/lib/design-variants src/__tests__/components/organisms`, `npx tsc --noEmit`, `npx eslint`.
- [ ] `npm run build`. Check the route bundle sizes for `/` on a generic tenant. They must not grow more than 5% against the build before this phase. Write the two numbers in the commit body.
- [ ] No changelog row. Nobody sees a change.
- [ ] Commit spec + plan + code + baselines. Do not push.

## Self-review

- Spec sections 1–7 map to tasks 1–6.
- Shared names: `ThemeSection`, `resolveSection`, `ALL_VARIANTS`, `SectionListRenderer`, `VariantSurfaceEntry`, `genericKindToSections`. Phase 3 imports `ThemeSection` and `resolveSection`.
