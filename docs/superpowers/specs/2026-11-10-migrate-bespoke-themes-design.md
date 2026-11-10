# Phase 4 — Migrate the 6 bespoke themes

**Status:** draft, waiting for approval.
**Umbrella:** `docs/superpowers/specs/2026-11-10-tenant-design-system-design.md`.
**ADR:** `docs/adr/2026-11-tenant-design-system.md`.
**Depends on:** phase 2 (registry), phase 3 (theme document).

## Understanding

- Nago, Liora, Mi Mundo, Mozarthitos, Espacio Zenit, and Matiss become tokens, owned variants, and one published theme document each.
- Shared code stops comparing tenant slugs. The dispatchers go away.
- Each client moves alone. Its public look must not change.
- Behavior that differs per tenant (register extras, extra pages) becomes per-tenant data with domain names, not slug branches.

## Current state (checked 2026-11-10)

Files outside tests that mention each slug: Nago 111, Mozarthitos 86, Espacio Zenit 57, Matiss 57, Mi Mundo 52, Liora 49.

Custom properties in bespoke CSS: Nago 72, Espacio Zenit 53, Mi Mundo 39, Mozarthitos 33, Liora 29, Matiss 22.

Shared files with 2 or more slug comparisons (23):

| File | Comparisons |
|---|---|
| `src/lib/events/publicEventRegisterSurfaceClasses.ts` | 31 |
| `src/lib/cms/landingThemeEditorCatalog.ts` | 12 |
| `src/lib/events/publicEventListSurfaceClasses.ts` | 11 |
| `src/components/organisms/PublicBlogPageShell.tsx` | 8 |
| `src/lib/theme/publicExperienceNav.ts` | 7 |
| `src/lib/public/instituteAnswerPages.ts` | 7 |
| `src/lib/landing/sharePreviewBundleKey.ts` | 6 |
| `src/lib/landing/loadLandingMainSections.ts` | 6 |
| `src/lib/cms/resolveLandingMedia.ts` | 6 |
| `src/components/organisms/RegisterSurfaceByTemplate.tsx` | 6 |
| `src/components/organisms/PublicTenantChrome.tsx` | 6 |
| `src/components/organisms/PublicPrivacySurfaceByTemplate.tsx` | 6 |
| `src/components/organisms/PublicAnswerSurfaceByTemplate.tsx` | 6 |
| `src/app/[locale]/contact/page.tsx` | 6 |
| `src/lib/theme/marketingLandingKinds.ts` | 5 |
| `src/lib/cms/buildLandingEditorViewModel.ts` | 5 |
| `src/lib/events/publicEventDetailSurfaceClasses.ts` | 4 |
| `src/lib/events/publicEventSurfaceVariant.ts` | 3 |
| `src/lib/register/publicRegistrationInputFromFormData.ts` | 2 |
| `src/lib/register/packs/extrasPackForTemplateKind.ts` | 2 |
| `src/lib/register/buildRegistrationsExportTable.ts` | 2 |
| `src/components/register/RegisterFormAfterDni.tsx` | 2 |
| `src/app/[locale]/encuentra-tu-clase/page.tsx` | 2 |

Leaks of one client into shared paths:

1. Login, forgot-password, and reset-password show the Nago logo (`resolveNagoLogo`, `bundledPublicInstallIcon.ts`, `PublicFlowFrame`, `PublicExperienceShell`).
2. `src/app/[locale]/layout.tsx` builds Liora places when `templateKind === "liora"` from `dict.landing.liora.sedes`.
3. `encuentra-tu-clase` and `sitemap.ts` serve the page only for Mozarthitos.
4. Register extras packs are named after tenants (`RegistrationExtrasPackId = "nago" | "mozarthitos"`). The export table and the form branch on those names.
5. The dictionaries hold client copy under `landing.<slug>.*` (145 hits).

## Decision

### Step 0 — remove the leaks (before any client moves)

| Leak | Fix |
|---|---|
| Nago logo in auth flows | Auth chrome reads the active tenant logo from the brand layer (`app.logo.path`). The Nago asset becomes Nago brand data only. |
| Liora places in the root layout | JSON-LD places come from the tenant document (`pages.answers` props or `contact.*` brand keys). The root layout has no kind check. |
| `encuentra-tu-clase` tied to Mozarthitos | The route renders when the published document has `pages.findClass`. The sitemap lists the route under the same condition. |
| Register extras named after tenants | Packs get domain ids: `nago` becomes `martial_arts_uniform`, `mozarthitos` becomes `family_guide`. A tenant setting `register.extras_pack` in `public.site_settings` picks one or none. The form, the input parser, and the export read the setting. A migration writes the setting for the two tenants. |
| Admin views named after tenants (`AdminRegistrationNagoExtras.tsx`, `AdminRegistrationMozarthitosGuide.tsx`) | Rename to the pack ids (`AdminRegistrationUniformExtras`, `AdminRegistrationFamilyGuide`). `AdminRegistrationExpandedDetails` picks the view from the tenant setting, not the kind. |
| `sitemap.ts` `TEMPLATE_INDEXED_PATHS` keyed by `mozarthitos` | The sitemap lists extra paths from the published document `pages`. |
| Client copy in dictionaries | Client copy moves into the section props of that tenant's document (`es`, `en`, `pt`). Dictionaries keep only shared UI copy. |

### Per-client procedure

Order (small first): Matiss, Liora, Mozarthitos, Mi Mundo, Espacio Zenit, Nago.

For each client:

1. **Baseline.** Playwright screenshots of home, `/register`, contact, blog, privacy, answer pages, events list, event detail, and event register. Desktop 1280 px and phone 390 px, plus the installed PWA chrome where it exists. Store under `e2e/__screenshots__/clients/<slug>/`.
2. **Tokens.** Map bespoke variables (`--nago-ink`, `--nago-bg`, …) to `DesignTokensV1`. A variable with no token equivalent (easing curves, z-index, header height) stays inside the owned variants of that client as a private constant.
3. **Fonts.** Point the client's heading and body at catalog ids. Remove its `*FontRoot.tsx`.
4. **Owned variants.** Move each bespoke section and page tree into `src/variants/owned/<slug>/…/v1/`. Each gets a props schema, editor fields, fixtures, and visual baselines. Interactive sections ship `Web.tsx` and `Pwa.tsx`.
5. **Shared first.** If an owned section matches a shared variant with tokens only, use the shared variant. Do not copy it.
6. **Document.** Write the theme document for that tenant from the current content. Publish it through the phase 3 action. The migration script records the published version.
7. **Compare.** Rerun the baseline. Pixel diff ratio at most 0.1% per screenshot. Bigger diffs need a written approval from the user in the PR.
8. **Remove branches.** Delete that slug's branches from the dispatchers in the table above. Delete its bespoke CSS file once no owned variant imports it.
9. **Tests.** Move or rewrite the client tests to the owned variant folder.

### Dispatchers after all 6 clients

| Dispatcher | Replacement |
|---|---|
| `RegisterSurfaceByTemplate`, `PublicPrivacySurfaceByTemplate`, `PublicAnswerSurfaceByTemplate`, `PublicBlogPageShell`, `contact/page.tsx` | `SectionListRenderer` with `pages.<id>` from the document. |
| `PublicTenantChrome`, `publicExperienceNav` | `nav.*` and `footer.*` variants from the document. |
| `publicEvent*SurfaceClasses`, `publicEventSurfaceVariant` | Event pages read `--ds-*` tokens. Owned looks become `page.events*` variants. |
| `loadLandingMainSections`, `marketingLandingKinds` | The document `sections` list. |
| `resolveLandingMedia`, `sharePreviewBundleKey` | Media slots per section id, keyed by tenant and section, not by kind. |
| `landingThemeEditorCatalog`, `buildLandingEditorViewModel` | The variant `editorFields` (phase 6). |

### `SiteThemeKind` and `EXCLUSIVE_THEME_OWNERS`

- `template_kind` stays as a column. Values of migrated clients become legacy labels. No new value is added.
- `EXCLUSIVE_THEME_OWNERS` is replaced by `owner` on variants. The file goes away after the 6th client.
- Nothing is dropped from the database (rule 21).

## Options considered

| Option | Why rejected |
|---|---|
| Migrate all 6 in one change | One regression would hit 6 live sites. No safe rollback per client. |
| Keep bespoke CSS files as global imports | Global CSS leaks into other tenants and keeps kind checks. |
| Rewrite the bespoke looks with shared variants only | Loses the client identity the clients paid for. |
| Keep extras packs named by tenant | Every new tenant with the same need would add a slug. |

## Surfaces (Web vs PWA)

- **Public site (Tier A):** each client keeps its web and PWA look. Baselines cover desktop, phone browser, and the installed chrome. Interactive owned variants ship both trees.
- **PWA tests that must stay green:** `PublicPwaTabBar`, `PublicInstalledTopBar`, `tierADashboard*`, the Mozarthitos family guide PWA tests, and every `*Pwa*` / `*Mobile*` test for the moved surfaces. Tests move with their components.
- **CMS editors (Tier B):** keep working on legacy data until phase 6 switches them. The migration does not break the current editor for a migrated tenant: that editor becomes read-only for the moved fields and links to the new design tab.

## Risks and mitigation

| Risk | Mitigation |
|---|---|
| A client looks different after its move | Per-client baseline and 0.1% diff gate. Publish rollback in phase 3. |
| A live client edits content during its move | Freeze that client's CMS for the move window. Tell staff in the changelog (rule 39). |
| Register export changes columns | Snapshot tests of the export for both packs before and after. |
| SEO change on answer and find-class pages | Compare canonical, hreflang, and JSON-LD before and after per client (rule 47). |
| Large scope | One client per commit. Each commit leaves the site working. |

## Observability

- Migration script logs `[ge:server]` scope `themeMigration.<slug>` per step.
- `recordSystemAudit` on each client's first publish (phase 3 action).
- Product changelog entry per migrated client only if staff see a change in the editor (rule 39).

## Definition of done

- Step 0 leaks fixed with tests: auth chrome uses the tenant logo, no kind check in the root layout, find-class route by document, extras packs by setting.
- All 6 clients render from published documents with diffs under the gate.
- The 23 dispatcher files contain no tenant slug.
- `EXCLUSIVE_THEME_OWNERS` and the 6 `*FontRoot.tsx` files are gone.
- Dictionaries contain no `landing.<slug>` namespace.
- All moved PWA tests pass.

## Out of scope

- The precommit guard (phase 5). It runs in report mode during this phase.
- New editor UI (phase 6).

## Manual QA (user)

- After each client: home, `/register`, contact, events, and blog on desktop, on a phone browser, and in the installed PWA.
- Register on Nago and Mozarthitos with their extras. Download the registrations export.
- Login, forgot-password, and reset-password on two tenants show each tenant's own logo.
