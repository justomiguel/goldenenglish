# Phase 4 — Migrate the 6 bespoke themes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-11-10-migrate-bespoke-themes-design.md`
**Depends on:** phases 1, 2, 3, and 5 (the guard baseline must exist so each client commit can lower it).

**Goal:** The 6 bespoke clients render from their published theme document through owned variants. Shared code names no tenant. The guard runs with `--strict`.

**Architecture:** First, step 0 removes the leaks that put one tenant's identity in shared code. Then each client goes through the same 9-step procedure: baseline, tokens, fonts, owned variants, document, compare, remove branches, tests. After the 6th client, the dispatchers collapse to `SectionListRenderer`, and `EXCLUSIVE_THEME_OWNERS` goes away.

**Tech Stack:** Next.js App Router, phase 2 registry, phase 3 document service, Playwright `toHaveScreenshot`, Postgres migrations.

## Global Constraints

- Order: Matiss, Liora, Mozarthitos, Mi Mundo, Espacio Zenit, Nago.
- One commit per client, plus one per step 0 group. Each commit leaves every tenant working.
- Visual gate: `maxDiffPixelRatio: 0.001` per screenshot. A bigger diff needs written user approval in that commit's description.
- Viewports 1280 px and 390 px, plus installed PWA chrome (`display-mode: standalone` emulation) where the client has PWA trees.
- Pack ids: `martial_arts_uniform` (was `nago`), `family_guide` (was `mozarthitos`). Setting key: `register.extras_pack`.
- Owned paths: `src/variants/owned/<slug>/<slot>/<name>/v1/`.
- `template_kind` stays as a column. No value is dropped (rule 21).
- Client copy leaves the dictionaries and moves into document props (`es`, `en`, `pt`).
- After each client: `npm run check:institute-hardcode -- --update-baseline`. The count can only go down.
- Changelog row (rule 39) per commit that staff can notice. Step 0 extras changes are visible to admins.

## Section A — Step 0: remove the leaks

### Task A1: Auth chrome logo from the brand layer

- [ ] Find the Nago asset in auth: `rg -n "nago" src/components/**/auth* src/app/**/login* src/app/**/forgot* src/app/**/reset*`.
- [ ] Red: a test for each auth shell. Render with a mocked brand `logoPath: "/x.png"` and assert the `img` `src`. A test with tenant `golden` asserts no `nago` string in the markup.
- [ ] Green: read `app.logo.path` through `getBrandPublic()`. Move the Nago file reference to Nago brand data (`site_themes.properties` of Nago, through a `-- ge:brand-data nago` migration only if the row lacks it).

### Task A2: Root layout JSON-LD places

- [ ] Red: `layout` test. Tenant `liora` with `contact.address` set renders a JSON-LD place from that key. Tenant `golden` renders no Liora place. Search the layout source for `liora` and assert it is absent.
- [ ] Green: build places from `contact.*` keys, or from `pages.answers` props when the published document has them. Remove the kind check.

### Task A3: Find-class route and sitemap

- [ ] Red: the `encuentra-tu-clase` page calls `notFound()` when the published document has no `pages.findClass`. It renders when the page exists. The sitemap test lists the path only when the page exists. `TEMPLATE_INDEXED_PATHS` has no slug key.
- [ ] Green: replace `TEMPLATE_INDEXED_PATHS` with `documentIndexedPaths(document): string[]` in `src/lib/site/documentIndexedPaths.ts` (pure). Map `findClass` → `/encuentra-tu-clase`, `events` → `/eventos`, `blog` → `/blog`.
- [ ] Data: add `pages.findClass` to Mozarthitos when its document is written (task C3). Until then the legacy fallback for kind `mozarthitos` must include `pages.findClass`. Add that to `legacyThemeToDocument` with a test.

### Task A4: Register extras packs by domain setting

**Produces:**

```ts
export const REGISTER_EXTRAS_PACKS = ["martial_arts_uniform", "family_guide"] as const;
export type RegisterExtrasPack = (typeof REGISTER_EXTRAS_PACKS)[number];
export function parseRegisterExtrasPack(value: string | null | undefined): RegisterExtrasPack | null;
```

- [ ] Red: `registerExtrasPack.test.ts`. Known ids parse. `nago`, `mozarthitos`, empty, and unknown values return `null`.
- [ ] Red: update the tests of `RegisterForm`, `registerFormHandlers`, `RegisterFormAfterDni`, the input parser, and the export. They take `extrasPack` from props, not from the kind.
- [ ] Green.
  - Replace `extrasPackForTemplateKind` with a server read of `site_settings` key `register.extras_pack`.
  - Rename `AdminRegistrationNagoExtras.tsx` to `AdminRegistrationUniformExtras.tsx` and `AdminRegistrationMozarthitosGuide.tsx` to `AdminRegistrationFamilyGuide.tsx`.
  - `AdminRegistrationExpandedDetails`, `AdminRegistrationPwaCard`, `AdminRegistrationCreateButton`, and `admin/registrations/page.tsx` pick the view from the setting.
  - Rename the `Mozarthitos*Guide*` molecules and their PWA twins to `FamilyGuide*`.
- [ ] Migration `<next>_register_extras_pack_setting.sql` (product SQL, `public.`). It inserts `register.extras_pack` for the tenant row whose `template_kind` is `nago` or `mozarthitos`, `on conflict do nothing`. It reads the kind from data, so the file names no slug. Apply with the all-tenants command.
- [ ] Add the setting to the site settings admin screen as a select with dictionary labels (`none`, `martial_arts_uniform`, `family_guide`). Admin save audits through `recordSystemAudit`.
- [ ] Changelog row `register-extras-setting`, area `registrations`.

### Task A5: Client copy out of dictionaries

- [ ] List the client namespaces: `node -e` over `en.json` keys matching the slug list in `scripts/institute-slugs.json`. Paste the list into this task as a checklist before you start.
- [ ] Keep the keys in this task. Each client task (section C) moves its own namespace into the document and deletes the keys. This task only adds the dictionary shape test that the guard uses (`slug_dictionary`).

## Section B — Per-client procedure (used by every task in section C)

Run these 9 steps for the client named in the task. The task gives the client inputs.

1. Baseline. Write `e2e/clients/<slug>.visual.spec.ts` with the page list from the spec. Run `npx playwright test e2e/clients/<slug>.visual.spec.ts --update-snapshots` on the isolated stack with that tenant's seed. Commit the baselines before any code change.
2. Tokens. Fill a table in the client task: each bespoke variable → `DesignTokensV1` key or "private constant". Write the token values into the tenant document.
3. Fonts. Set `fontIds.heading` and `fontIds.body` to catalog ids. Delete `<Client>FontRoot.tsx`, its test, and its import sites.
4. Owned variants. Move each section and page tree into `src/variants/owned/<slug>/…/v1/` with `props.ts`, `fixtures.ts`, `editorFields`, and `owner: "<slug>"`. Interactive pieces ship `Web.tsx` and `Pwa.tsx`. Replace bespoke variables with `--ds-*` or private constants in the variant folder.
5. Shared first. Before each move, check whether a shared variant renders the same with tokens only. If yes, use it. Do not copy it.
6. Document. Write `scripts/theme-documents/<slug>.ts`. It exports the `ThemeDocumentV1` built from the current content (skin content, dictionary copy for that client, media keys). Run `npx tsx scripts/publish-theme-document.ts <slug>`. That script calls `createThemeDocumentService` with `actor.role = "staff"` and prints the version. Write the script in task C1. Later clients reuse it.
7. Compare. Rerun step 1 without `--update-snapshots`. Every screenshot is within the gate.
8. Remove branches. Delete the slug's cases from each dispatcher (list below). Delete its CSS file in `src/styles/` when nothing imports it. Remove its entry from `EXCLUSIVE_THEME_OWNERS`.
9. Tests and guard. Move client tests next to the owned variants. Run `npx vitest run src/__tests__` for touched folders and `npm run check:institute-hardcode -- --update-baseline`. Commit.

Dispatchers to clean, per client: `RegisterSurfaceByTemplate`, `PublicPrivacySurfaceByTemplate`, `PublicAnswerSurfaceByTemplate`, `PublicBlogPageShell`, `contact/page.tsx`, `PublicTenantChrome`, `publicExperienceNav`, `publicEvent*SurfaceClasses`, `publicEventSurfaceVariant`, `loadLandingMainSections`, `marketingLandingKinds`, `resolveLandingMedia`, `sharePreviewBundleKey`, `landingThemeEditorCatalog`, `buildLandingEditorViewModel`, and the rest of the 23 files listed in the spec. Find the remaining ones with `rg -l '"<slug>"' src --glob '!src/variants/owned/**' --glob '!src/__tests__/**'`.

## Section C — Clients

### Task C1: Matiss (57 files, 22 variables)

- [ ] Inputs: `src/styles/matissLanding.css`, `RegisterMatissSurface.tsx`, `LandingMainSectionsMatiss*`, `MatissFontRoot.tsx`. Specs `2026-11-10-matiss-*` describe the current look and are the reference for the baseline.
- [ ] Write `scripts/publish-theme-document.ts` and its pure helper `src/lib/theme-document/buildPublishPlan.ts`, with a unit test (document valid, service called once, dry-run flag prints the hash and does not publish).
- [ ] Run section B steps 1–9.
- [ ] Changelog row only if the user approves a visible diff. Otherwise none.

### Task C2: Liora (49 files, 29 variables)

- [ ] Inputs: `lioraLanding.css`, `RegisterLioraSurface.tsx`, `LandingMainSectionsLiora*`, `LioraFontRoot.tsx`, the Liora answer pages.
- [ ] Run section B steps 1–9.

### Task C3: Mozarthitos (86 files, 33 variables)

- [ ] Inputs: `mozarthitosLanding.css`, `LandingMozarthitos*`, the family guide molecules renamed in task A4, the find-class page.
- [ ] The document includes `pages.findClass`. Remove the legacy fallback case added in task A3.
- [ ] Run section B steps 1–9.

### Task C4: Mi Mundo (52 files, 39 variables)

- [ ] Inputs: `mimundoLanding.css`, `RegisterMiMundoSurface.tsx`, `LandingMainSectionsMiMundo*`, `MiMundoFontRoot.tsx`.
- [ ] Run section B steps 1–9.

### Task C5: Espacio Zenit (57 files, 53 variables)

- [ ] Inputs: `espacioZenitLanding.css`, `RegisterEspacioZenitSurface.tsx`, `EspacioZenitFontRoot.tsx`, the 3 owned OTF catalog entries from phase 1.
- [ ] Run section B steps 1–9.

### Task C6: Nago (111 files, 72 variables)

- [ ] Inputs: `nagoLanding.css`, `RegisterNagoSurface.tsx`, `LandingMainSectionsNago*`, `NagoFontRoot.tsx`, Nago PWA chrome.
- [ ] The install chrome (`NAGO_INSTALL_CHROME`) belongs to phase 7. If phase 7 is not done, leave that file and its baseline entry. Note it in the commit body.
- [ ] Run section B steps 1–9.

## Section D — Close out

### Task D1: Collapse dispatchers

- [ ] Each dispatcher now has only the generic branch. Replace it with `SectionListRenderer` reading `pages.<id>` or `sections` from `loadPublishedThemeDocument`.
- [ ] Delete `src/lib/theme/exclusiveThemeKinds.ts` and its test. The CMS kind picker uses `variantsForTenant` for owned page variants. Keep `kind_not_available` as the code for an owned variant picked by another tenant, mapped from `variant_not_available`.
- [ ] Remove the `page.bespoke-<kind>` bridge variants from phase 3.
- [ ] Red-green test: `src/__tests__/lib/theme/noBespokeKindBranches.test.ts` reads the dispatcher files and asserts they contain no slug literal.

### Task D2: Strict guard

- [ ] `npm run check:institute-hardcode -- --strict`. Expect exit 0.
- [ ] Change `precommit` to call it with `--strict`. Delete `scripts/institute-hardcode-baseline.json`.
- [ ] Update rule 53: the baseline is gone.
- [ ] Update `docs/adr/2026-11-tenant-design-system.md` consequences: phase 4 done.
- [ ] Commit. Do not push.

## Manual QA (user)

- After each client commit: open that client's home, `/register`, contact, blog, answers, and events on desktop and phone. Install the PWA where it exists.
- After task A4: create a registration on Nago and Mozarthitos and check the admin detail view.

## Self-review

- Spec step 0 table → tasks A1–A5. Per-client procedure → section B. Dispatcher table → section B step 8 and task D1. `EXCLUSIVE_THEME_OWNERS` → tasks C* step 8 and D1.
- Names used from earlier phases: `createThemeDocumentService`, `loadPublishedThemeDocument`, `legacyThemeToDocument`, `SectionListRenderer`, `variantsForTenant`, `check:institute-hardcode`.
