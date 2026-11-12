# Finish the tenant design system

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Stay on `main`. Do not create a worktree. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the design-system program: Matiss, the other five bespoke clients, then install identity, email identity, dashboard identity, and the scale budgets.

**Architecture:** Each bespoke client keeps its current paint. Owned variants and a host-props adapter feed `SectionListRenderer`. The dispatcher branch for that client is deleted only after a screenshot compare stays inside 0.1%. Later phases read the published document. They do not name a tenant.

**Tech Stack:** Next.js App Router, Vitest, Playwright, Zod, Supabase migrations.

**Specs:** `docs/superpowers/specs/2026-11-10-tenant-design-system-design.md` and the phase specs it lists. Per-client procedure: `docs/superpowers/plans/2026-11-10-migrate-bespoke-themes.md`.

## Global Constraints

- Stay on `main`. Do not create a branch, a worktree, or a stash.
- Do not push. Do not deploy. Do not commit until the user asks. One commit per client when they ask.
- Do not re-apply migrations `273`, `274`, `275`, or pulsar `037`.
- Do not run a live `publish-theme-document` until the user asks. Dry-run is allowed.
- Do not kill the `dev:pulsar` process on port 3000.
- Do not raise `scripts/institute-hardcode-baseline.json`. `--update-baseline` only lowers counts.
- A file outside `src/variants/owned/<slug>/`, tests, e2e, docs, supabase, scripts, and public must not gain a new slug comparison, slug key, or slug filename.
- Pixel gate: `maxDiffPixelRatio: 0.001`. Do not run `--update-snapshots` to hide a product diff.
- Contact and events photographs are the one exception. Task 1 records it.
- Spanish copy stays neutral tuteo. New English sentences follow short ASD-STE100 sentences.
- Tier A screens keep a Web tree and a PWA tree. The design editor stays Tier B.
- The gate marker is not path-scoped. Before the first `src/` edit of a task, write `.cursor/sdd-gate0-approved` to the spec named in that task.

## Already done — do not redo

- Tokens, font catalog, migration `273`.
- Hardcode guard. Working baseline is 260. The file is untracked.
- Variant registry, including `MATISS_VARIANTS` and `CLIENT_VARIANT_ENTRIES` for the eight interactive Matiss ids.
- Theme document lifecycle. Matiss document validates for slug `matiss` and rejects another slug.
- Design editor code. Task 8 of `docs/superpowers/plans/2026-11-10-design-editor.md` is the commit only.
- Migrate tasks A1–A5.
- Matiss trees under `src/variants/owned/matiss/`. CSS uses `--ds-*` and `--owned-*`. The phone tab bar uses those names.
- Matiss screenshots inside the gate: home, register, blog, privacy, answers, phone home, phone PWA. The spec hides `nextjs-portal` and caps `img.decode()` at 3 seconds.
- Component tests for the moved Matiss sections sit next to those variants.

## Still open

1. Matiss contact and events screenshots (photograph bytes).
2. Matiss host props, then delete its dispatcher branches.
3. Liora, Mozarthitos, Mi Mundo, Espacio Zenit, Nago.
4. Collapse the remaining dispatchers and turn the guard `--strict`.
5. Phase 7 install identity, phase 9 email identity, phase 10 dashboard identity, phase 8 scale budgets.

---

### Task 1: Close the Matiss photograph gate

**Files:**
- Modify: `e2e/clients/matiss.visual.spec.ts`
- Modify: `playwright.config.ts` (snapshot folder only, in Task 4)

**Interfaces:**
- Consumes: `CLIENT_VISUAL_BASE_URL=http://matiss.localhost:3000`
- Produces: contact and events tests that ignore `img` pixels. Chrome still counts.

- [x] **Step 1: Write the failing assertion**

In `e2e/clients/matiss.visual.spec.ts`, pass a mask only for `contact` and `events`:

```ts
const mask = name === "contact" || name === "events" ? [page.locator("img")] : [];
await expect(page).toHaveScreenshot(`${name}-${width}.png`, { ...shot, mask });
```

- [x] **Step 2: Recapture only those four files**

Run:

```bash
CLIENT_VISUAL_BASE_URL=http://matiss.localhost:3000 npx playwright test e2e/clients/matiss.visual.spec.ts --grep "contact at|events at" --update-snapshots --reporter=line
```

Expected: `contact-1280.png`, `contact-390.png`, `events-1280.png`, `events-390.png` are rewritten. No other snapshot is rewritten.

- [x] **Step 3: Re-run without `--update-snapshots`**

```bash
CLIENT_VISUAL_BASE_URL=http://matiss.localhost:3000 npx playwright test e2e/clients/matiss.visual.spec.ts --grep "contact at|events at|home at 1280$" --reporter=line
```

Expected: PASS. Home at 1280 still compares the real photograph.

**Written exception:** Events differed by 37768 pixels before the CSS rename and by the same count after it. The bytes are `next/image`, not the chrome. Masking `img` on contact and events is the gate. Do not mask home, register, blog, privacy, or answers.

### Task 2: Matiss host props

**Files:**
- Create: `src/variants/owned/matiss/home/v1/hostProps.ts`
- Test: `src/variants/owned/matiss/home/v1/hostProps.test.ts`
- Modify: `src/components/organisms/LandingMainSectionsMatiss.tsx`
- Modify: `src/variants/owned/matiss/document.ts`

**Interfaces:**
- Consumes: `LandingMainSectionHostProps` from `src/lib/landing/loadLandingMainSections.ts`
- Produces: `buildMatissHomeProps(host): LandingMatissExperienceProps`

The experience needs `dict`, `brand`, `locale`, `links`, `images`, `sessionEmail`, `openMenu`, `closeMenu`, `publicCtaMode`, and `inscriptionsEnabled`. The document section `props` stay `{}`. The host builds the props at request time. `SectionListRenderer` must not render the flat section list on the live home. That list is for the editor. Rendering both doubles the page.

- [x] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { buildMatissHomeProps } from "@/variants/owned/matiss/home/v1/hostProps";

describe("buildMatissHomeProps", () => {
  it("builds the eight image slots and the studio links", () => {
    const props = buildMatissHomeProps({
      dict: { landing: { matiss: {} } } as never,
      brand: { name: "Matiss", logoPath: "/logo.png", logoAlt: "Matiss" } as never,
      locale: "es",
      sessionEmail: null,
      mediaMap: new Map(),
    });
    expect(props.images.gallery).toHaveLength(8);
    expect(props.images.programs).toHaveLength(3);
    expect(props.links.map((link) => link.href)).toContain("/es#horarios");
    expect(props.locale).toBe("es");
  });
});
```

Copy the link labels through `marketingLandingCopy`. The test may mock that function if the fixture dict is empty. Assert hrefs, not the Spanish sentences.

- [x] **Step 2: Run the test**

```bash
npx vitest run src/variants/owned/matiss/home/v1/hostProps.test.ts
```

Expected: FAIL. `buildMatissHomeProps` is not defined.

- [x] **Step 3: Move the prop builder**

Move the body of `LandingMainSectionsMatiss` into `buildMatissHomeProps`. The composer calls it and still renders `MatissFontRoot` plus `LandingMatissExperience`. Do not switch the dispatcher in this task.

Add `pages.home` to `src/variants/owned/matiss/document.ts`:

```ts
home: { sections: [section("home", "page.matiss-home")] },
```

Keep the existing `sections` array. A test in `src/__tests__/variants/owned/matissDocument.test.ts` asserts `document.pages.home.sections[0].variantId === "page.matiss-home"`.

- [x] **Step 4: Run the tests**

```bash
npx vitest run src/variants/owned/matiss/home/v1/hostProps.test.ts src/__tests__/variants/owned/matissDocument.test.ts src/__tests__/components/organisms/LandingMainSectionsMatiss.nav.test.tsx
```

Expected: PASS.

- [x] **Step 5: Compare the home**

```bash
CLIENT_VISUAL_BASE_URL=http://matiss.localhost:3000 npx playwright test e2e/clients/matiss.visual.spec.ts --grep "home at 1280$|home at 390$" --reporter=line
```

Expected: PASS. If it fails, revert the composer wiring. Do not update the snapshot.

### Task 3: Render Matiss home through the page variant

**Files:**
- Modify: `src/components/organisms/LandingMainSectionsMatiss.tsx`
- Test: `src/__tests__/components/organisms/LandingMainSectionsMatiss.nav.test.tsx`

**Interfaces:**
- Consumes: `buildMatissHomeProps`, `CLIENT_VARIANT_ENTRIES["page.matiss-home@1"]`
- Produces: the home still paints `LandingMatissExperience` with the host props

- [x] **Step 1: Write the failing test**

The nav test renders the composer. Add one assertion: the home root includes `data-variant-entry="page.matiss-home@1"`.

- [x] **Step 2: Run it**

```bash
npx vitest run src/__tests__/components/organisms/LandingMainSectionsMatiss.nav.test.tsx
```

Expected: FAIL. The attribute is absent.

- [x] **Step 3: Render the entry**

`LandingMainSectionsMatiss` keeps `MatissFontRoot`. Inside it, render:

```tsx
<VariantSurfaceEntry variantKey="page.matiss-home@1" props={buildMatissHomeProps(props)} />
```

Do not also render `LandingMatissExperience`. Do not render `document.sections`. Mock `useAppSurface` to `"web-desktop"` in the nav test.

- [x] **Step 4: Unit test, then screenshots**

```bash
npx vitest run src/__tests__/components/organisms/LandingMainSectionsMatiss.nav.test.tsx
CLIENT_VISUAL_BASE_URL=http://matiss.localhost:3000 npx playwright test e2e/clients/matiss.visual.spec.ts --grep "home at 1280$|register at 390$" --reporter=line
```

Expected: PASS. A miss means the entry dropped props. Put the direct experience call back and stop this task.

### Task 4: Fix the screenshot folder before the next client

**Files:**
- Modify: `playwright.config.ts`

- [x] **Step 1: Replace the hardcoded folder**

The Matiss project keeps the name `chromium-client-visual` and the folder `clients/matiss`. Its `testMatch` is only `clients/matiss.visual.spec.ts`. A later client adds its own project and its own `clients/<slug>/` folder. `{projectName}` would move the Matiss shots out of `clients/matiss`.

- [x] **Step 2: Confirm Matiss shots still resolve**

```bash
CLIENT_VISUAL_BASE_URL=http://matiss.localhost:3000 npx playwright test e2e/clients/matiss.visual.spec.ts --grep "home at 1280$" --reporter=line
```

Expected: PASS and no new snapshot path.

### Task 5: Delete Matiss dispatcher branches

Do this only after Task 3 screenshots pass.

**Files:** the Matiss `case` and `kind === "matiss"` branches in the dispatcher list in `docs/superpowers/plans/2026-11-10-migrate-bespoke-themes.md` section B. Leave `MatissFontRoot` until the home screenshot still passes without it.

**Interfaces:**
- Consumes: `loadPublishedThemeDocument` or the static `document` when no published row exists
- Produces: shared landing, register, contact, blog, privacy, and answers read `pages.<id>` for Matiss

- [x] **Step 1: One dispatcher at a time**

The home composer renders `VariantSurfaceEntry` for `page.matiss-home@1` inside `MatissFontRoot`. The landing loader finds that composer from `src/variants/owned/matiss/landingEntry.ts`. Register, contact, blog, privacy, answers, and chrome call `renderOwnedSurface`. The owned file still paints the same components. Shared files no longer compare `matiss`. `MatissFontRoot` stays.

- [x] **Step 2: After each dispatcher, run the matching screenshot**

Home, register, contact, blog, privacy, and answers at 1280 passed. Register at 390 passed. Event detail passed.

- [x] **Step 3: Guard**

Baseline rows: 250. The count went down.

- [ ] **Step 4: Font root**

Delete `MatissFontRoot` only if moving `CATALOG_FONTS.fraunces` and `CATALOG_FONTS.nunito` onto the same wrapper keeps `home at 1280` inside 0.1%. If the label font changes, keep the file.

### Task 6: Liora, Mozarthitos, Mi Mundo, Espacio Zenit, Nago

Run section B of `docs/superpowers/plans/2026-11-10-migrate-bespoke-themes.md` once per client. Use the Matiss rules from Tasks 1–5. Do not start a client until the previous client's screenshots pass.

| Order | Client | Host | Extra rule |
|---|---|---|---|
| 1 | Liora | `http://liora.localhost:3000` | New Playwright project. Shots go to `e2e/__screenshots__/clients/liora/`. |
| 2 | Mozarthitos | `http://mozarthitos.localhost:3000` | `pages.findClass` uses `page.find-class`. Delete the `kind === "mozarthitos"` fallback in `encuentra-tu-clase/page.tsx` only after that page's screenshot passes. |
| 3 | Mi Mundo | `http://mimundo.localhost:3000` | Same 9 steps. |
| 4 | Espacio Zenit | `http://espaciozenit.localhost:3000` | Keep the three owned OTF catalog entries. |
| 5 | Nago | `http://nago.localhost:3000` | Leave `NAGO_INSTALL_CHROME` and `bundledPublicInstallIcon` for Task 8. |

For each client:

1. Capture baselines before moving code. Widths 1280 and 390. Pages: `/es`, `/es/register`, `/es/contact`, `/es/blog`, `/es/privacidad`, `/es/preguntas`, `/es/events`. Hide `nextjs-portal`. Cap image decode at 3 seconds. Mask `img` on contact and events only.
2. Write `src/variants/owned/<slug>/tokens.ts`. Map CSS variables to `DesignTokensV1` or a private `--owned-*` constant. `color.border` must pass 3:1 against the paper. Keep the real hairline as a private constant when it fails.
3. Move sections with `git mv` into `src/variants/owned/<slug>/…/v1/`. Add `props.ts`, `registry.ts`, `document.ts`, and `clientEntries.ts` for interactive variants. Spread the entries in `src/variants/clientEntries.ts`.
4. Add `build<Client>HomeProps` the same way as `buildMatissHomeProps`. The live home renders `pages.home` only.
5. Dry-run `npx tsx scripts/publish-theme-document.ts <slug> --dry-run`. Do not publish live.
6. Compare without `--update-snapshots`. Then delete that client's dispatcher branches one file at a time.
7. Move that client's component tests next to the variants. Run `npm run check:institute-hardcode -- --update-baseline`.

Dictionary keys in task A5 of the migrate plan are deleted inside the client that owns them. Do not delete another client's keys.

### Task 7: Collapse dispatchers and the strict guard

**Files:** the dispatcher list in the migrate plan, section D1 and D2.

- [ ] **Step 1: Shared path only**

Each dispatcher has one path. It reads `pages.<id>` or `sections` from `loadPublishedThemeDocument`. There is no slug `case`.

- [ ] **Step 2: Failing test, then the guard**

`src/__tests__/lib/theme/noBespokeKindBranches.test.ts` reads the dispatcher files and fails when a slug literal remains.

```bash
npm run check:institute-hardcode -- --strict
```

Expected: exit 0. Then change `precommit` to call the guard with `--strict` and delete `scripts/institute-hardcode-baseline.json`. Update rule `53-no-institute-hardcode.mdc` and `docs/adr/2026-11-tenant-design-system.md`.

### Task 8: Phase 7 — PWA install identity

**Spec:** `docs/superpowers/specs/2026-11-10-pwa-install-identity-design.md`
**Plan:** `docs/superpowers/plans/2026-11-10-pwa-install-identity.md`

Execute that plan's Tasks 1–5. `bundledPublicInstallIcon` no longer branches on `nago`. Install colors come from `install.theme` and `install.background`. Icon upload uses `InlineUploadProgressBar`.

Set the gate marker to the phase 7 spec before the first `src/` edit.

### Task 9: Phase 9 — Email identity

**Spec:** `docs/superpowers/specs/2026-11-10-email-identity-per-tenant-design.md`
**Plan:** `docs/superpowers/plans/2026-11-10-email-identity-per-tenant.md`

Execute that plan's Tasks 1–5. `wrapEmailHtml` takes `deriveEmailTokens`. No hex from the Golden palette remains in the wrapper.

### Task 10: Phase 10 — Dashboard identity

**Spec:** `docs/superpowers/specs/2026-11-10-dashboard-identity-per-tenant-design.md`
**Plan:** `docs/superpowers/plans/2026-11-10-dashboard-identity-per-tenant.md`

Execute that plan's Tasks 1–5. Dashboards use `app.*` tokens. Student and parent screens keep their PWA trees.

### Task 11: Phase 8 — Scale budgets

**Spec:** `docs/superpowers/specs/2026-11-10-scale-1000-tenants-design.md`
**Plan:** `docs/superpowers/plans/2026-11-10-scale-1000-tenants.md`

Execute that plan's Tasks 1–7. This phase does not change the look of a site.

### Task 12: Commit gate, only if the user asks

- [ ] Design editor changelog row `design-editor` in the next free pulsar file. Do not reuse ids through `040`.
- [ ] One changelog row per client only when a person can see a difference. The Matiss CSS rename and the tab-bar fix are visible. Contact and events masks are not.
- [ ] Commit spec, this plan, the migrate plan, and the code for that slice together. Do not push.

## Self-review

- Phases 1–3, 5, and 6 are marked done. The plan does not reopen them.
- Phase 4's open work is Tasks 1–7.
- Phases 7, 9, 10, and 8 are Tasks 8–11 and point at their existing plans.
- The home renderer never paints `document.sections` and `pages.home` together.
- The photograph exception is limited to contact and events.
- No step tells the agent to publish live, push, or raise the hardcode baseline.
