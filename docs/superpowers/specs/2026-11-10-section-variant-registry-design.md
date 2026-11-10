# Phase 2 — Section variant registry

**Status:** draft, waiting for approval.
**Umbrella:** `docs/superpowers/specs/2026-11-10-tenant-design-system-design.md`.
**ADR:** `docs/adr/2026-11-tenant-design-system.md`.
**Depends on:** phase 1 (`DesignTokensV1`, `--ds-*` variables).

## Understanding

- A site is an ordered list of sections. Each section names a variant id, a pinned major version, and props.
- Variants live in code in one registry. A tenant does not add code to get a different composition.
- A new major version is opt-in per tenant. A patch reaches every tenant on that major.
- An owned variant renders only for its owner tenant.

## Current state (checked 2026-11-10)

1. Generic institute kinds already pick layouts from a fixed map: `genericLandingComposition()` in `src/lib/landing/genericLandingComposition.ts`. Hero has 5 layouts (`bleed`, `split`, `masthead`, `stage`, `title`). Day, bands, and close have 5 each.
2. These layouts render in `src/components/organisms/generic-landing/` (`GenericLandingHero.tsx`, `GenericLandingDay.tsx`, `GenericLandingBands.tsx`, `GenericLandingClose.tsx`).
3. Content comes from `skin_content` through `src/lib/landing/skin/skinModel.ts` (`SKIN_SECTION_IDS`, `SKIN_FIELDS`, `SKIN_LISTS`).
4. Bespoke kinds render their own landing trees. They do not use the generic layouts.
5. There is no version on any section component. Every edit reaches every tenant that renders it.
6. Playwright exists (`playwright.config.ts`). No spec uses `toHaveScreenshot` today.

## Decision

### 1. Variant contract

Module `src/lib/design-variants/` (pure types and registry data). Components live in `src/variants/`.

```ts
type SectionVariant<P> = {
  id: string;            // "hero.split"
  slot: SectionSlot;     // "hero" | "band" | "schedule" | "team" | "faq" | "contact" | "close" | "nav" | "footer" | "page"
  major: number;
  patch: number;
  owner?: string;        // tenant slug; absent = shared
  propsSchema: ZodType<P>;
  editorFields: ReadonlyArray<VariantEditorField>;
  consumesTokens: ReadonlyArray<DesignTokenKey>;
  interactive: boolean;
  web: () => Promise<{ default: ComponentType<P> }>;
  pwa?: () => Promise<{ default: ComponentType<P> }>;
  migrateProps?: (fromMajor: number, props: unknown) => unknown;
};
```

- `id` + `major` is the identity. `patch` is metadata for audit and visual regression.
- A variant reads color, font, radius, and spacing only through `--ds-*` variables. It has no hex values and no tenant slug.
- `editorFields` describes the editable props for phase 6 (`text`, `longText`, `image`, `list`, `select`, `toggle`). Each field has a stable key and a dictionary label key.
- `interactive: true` variants (nav, forms, tab bars, carousels) must ship `pwa`. A content-only variant may omit `pwa`. Then its `web` component is used on both surfaces and must pass rule 05 touch targets.
- `migrateProps` converts props from the previous major. Phase 6 uses it for the upgrade flow.

### 2. File layout

- Shared: `src/variants/<slot>/<name>/v<major>/Web.tsx`, `Pwa.tsx`, `props.ts`, `index.ts`.
- Owned: `src/variants/owned/<tenantSlug>/<slot>/<name>/v<major>/…`.
- A new major version is a new folder. The old folder stays until the fleet count for it is zero for 90 days.
- One registry file per slot (`src/lib/design-variants/registry/<slot>.ts`). Each file stays under 250 lines (rule 03).

### 3. Registry API (pure)

- `getVariant(id, major)`: returns the variant or `null`.
- `latestMajor(id)`.
- `variantsForTenant(tenantSlug, slot?)`: shared variants plus owned variants of that tenant.
- `resolveSection(section, tenantSlug)`: returns `{ ok: true, variant, props }` or `{ ok: false, code }`.

Codes (rule 50):

| Code | Cause |
|---|---|
| `variant_version_missing` | The pinned major is not in the registry. |
| `variant_not_available` | The variant is owned by another tenant. |
| `variant_props_invalid` | Props fail `propsSchema`. |

### 4. Renderer

- `SectionListRenderer` (Server Component) takes the resolved sections and the tenant slug.
- A section that fails `resolveSection` does not render. The server logs `[ge:server]` with scope `designVariants.render`, the code, the tenant slug, the section id, and the variant id. The page keeps the other sections.
- For each section the renderer loads `web` through `import()`. Only pinned variants enter the bundle.
- For a variant with `pwa`, a thin client entry (`VariantSurfaceEntry`) uses `SurfaceMountGate` and `next/dynamic` to load only the active tree.

### 5. Seed: generic layouts become shared variants

| Current layout | Variant id | Major |
|---|---|---|
| Hero `bleed`, `split`, `masthead`, `stage`, `title` | `hero.bleed`, `hero.split`, `hero.masthead`, `hero.stage`, `hero.title` | 1 |
| Day `rows`, `rule`, `prospectus`, `recital`, `steps` | `schedule.rows`, … | 1 |
| Bands `alternate`, `cluster`, `ruled`, `paper`, `breaks` | `band.alternate`, … | 1 |
| Close `paper`, `quiet`, `narrow`, `stage`, `under` | `close.paper`, … | 1 |
| Generic nav, footer, contact form, map | `nav.generic`, `footer.generic`, `contact.form`, `contact.map` | 1 |

- The current components move into the variant folders with no visual change.
- `genericLandingComposition()` becomes `genericKindToSections(kind)`. It returns the section list for that kind. Generic tenants render through the registry from this phase on.
- Props schemas derive from `SKIN_FIELDS` and `SKIN_LISTS` so `skin_content` keeps working.

### 6. Visual regression per variant

- A fixture file per variant major (`fixtures.ts`) holds 1 to 3 prop sets and a token set.
- Route `src/app/[locale]/plantilla/variante/[id]/[major]/page.tsx` renders one variant with one fixture. It is `noindex`, absent from the sitemap, and returns 404 unless `GE_DEV_TARGET` is `e2e` or `local`.
- `e2e/visual-variants.spec.ts` takes `toHaveScreenshot` per variant, fixture, and viewport (1280 px desktop, 390 px phone).
- Baseline images live in git under `e2e/__screenshots__/variants/`.
- A patch that changes a baseline fails the gate. A changed look must ship as a new major folder with its own baseline.
- The spec joins `test:e2e:precommit` and follows the pass cache (rule 34).

### 7. Fleet count

- `scripts/report-variant-fleet.mjs` reads each tenant's pinned sections and prints tenants per variant id and major.
- In phase 2 the source is `genericKindToSections` plus the theme kind of each tenant. Phase 3 switches the source to published theme documents and the Pulsar pins table.

## Options considered

| Option | Why rejected |
|---|---|
| Semver with minor versions | Minor adds a third rule with no extra isolation. Major means "looks different", patch means "same look". |
| Pin the exact patch per tenant | Security and a11y fixes would need 1000 approvals. |
| Load variants by a string path at runtime | Breaks static analysis and tree shaking in Next.js. |
| Props as free JSON, no schema | Phase 6 editor and publish checks need a schema. |
| One component with `variant` and `isPwa` props | Boolean prop growth (composition patterns, rule 01 shared vs fork). |
| Storybook for visual regression | Adds a second toolchain. Playwright is already in the gate. |

## Surfaces (Web vs PWA)

- **Public landing (Tier A):** every interactive variant has `Web.tsx` and `Pwa.tsx`. `VariantSurfaceEntry` picks one with `SurfaceMountGate`. Content variants without `pwa` must pass 44 px targets and safe areas on phones.
- **Variant preview route:** dev and E2E only. Desktop and phone viewports in Playwright.
- **Existing PWA trees:** `PublicPwaTabBar` and `PublicInstalledTopBar` stay outside the registry in this phase. Their tests must stay green. Phase 4 wraps them as `nav.*` variants.

## Plan outline

1. TDD the contract types, registry API, and `resolveSection` codes.
2. Move the 20 generic layouts into `src/variants/` with props schemas and fixtures.
3. `SectionListRenderer`, `VariantSurfaceEntry`, logs.
4. `genericKindToSections` and switch generic tenants to the renderer.
5. Variant preview route and `e2e/visual-variants.spec.ts` with baselines.
6. Fleet report script.

## Risks and mitigation

| Risk | Mitigation |
|---|---|
| Generic sites change after the move | Baseline screenshots of the 10 generic kinds before the move, compared after. |
| Screenshot noise (fonts, animation) | Fixtures disable motion (`motion.level: none`), wait for `document.fonts.ready`, fixed viewport. |
| Bundle growth | `import()` per variant. Lighthouse on 2 generic kinds before and after (rule 06). |
| Many major folders | Fleet report and 90-day removal rule. |

## Definition of done

- Registry API and codes have unit tests, including the unknown-variant and other-owner paths.
- The 10 generic kinds render through the registry with no visual diff.
- Visual regression runs in the precommit E2E gate with baselines in git.
- The fleet report prints counts.
- No shared variant file contains a tenant slug.

## Out of scope

- Theme document storage (phase 3).
- Bespoke tenants (phase 4).
- Editor UI (phase 6).

## Manual QA (user)

- Open each generic kind preview (`/plantilla/<kind>`) on desktop and phone. The look is the same as before.
