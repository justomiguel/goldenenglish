# Attack: finish the tenant design system

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Stay on `main`. Do not create a worktree. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the open design-system work in one run. Do not stop to ask the user to continue.

**Architecture:** Each slice uses the child plan that already has the code. This plan only sets the order, the overrides, and the commit. A slice is done when its tests pass and its commit is on `main`.

**Tech Stack:** Next.js App Router, Vitest, Playwright, Zod, Supabase migrations.

**Child plans (do not rewrite them):**

- `docs/superpowers/plans/2026-11-12-finish-design-system.md` — Tasks 1–4 and Task 5 steps 1–3 are done. Do not redo them.
- `docs/superpowers/plans/2026-11-10-migrate-bespoke-themes.md` — section B and section C.
- `docs/superpowers/plans/2026-11-10-pwa-install-identity.md` — Task 1 is already in commit `06c06cd6`. Start at Task 2.
- `docs/superpowers/plans/2026-11-10-email-identity-per-tenant.md`
- `docs/superpowers/plans/2026-11-10-dashboard-identity-per-tenant.md`
- `docs/superpowers/plans/2026-11-10-scale-1000-tenants.md`

## Global Constraints

- Stay on `main`. Do not create a branch, a worktree, or a stash.
- Do not push. Do not deploy. Do not run a live `publish-theme-document`. Dry-run is allowed.
- Do not re-apply migrations `273`, `274`, `275`, or pulsar `037`.
- Do not kill the process on port 3000.
- Do not raise `scripts/institute-hardcode-baseline.json`. `--update-baseline` only lowers counts.
- Do not set `SKIP_E2E`. If the isolated stack is down, stop and report that blocker.
- Pixel gate: `maxDiffPixelRatio: 0.001`. Do not run `--update-snapshots` after the baseline commit of that client.
- Mask `img` only on contact and events. Do not mask home, register, blog, privacy, or answers.
- Spanish copy stays neutral tuteo. New English sentences stay short.
- Tier A screens keep a Web tree and a PWA tree. The design editor stays Tier B.
- Before the first `src/` edit of a slice, write `.cursor/sdd-gate0-approved` to the spec named in that slice.
- The next free pulsar changelog file is `045`. Do not reuse ids through `044`.
- Out of scope: `2026-11-11-shared-schema-new-user-trigger-design.md`, `2026-11-12-mimundo-colonia-ages-design.md`, `2026-11-12-mimundo-gallery-stock-photos-design.md`. Leave those files untracked.

## Do not ask

This message is the approval. Do not ask "continua", "go ahead", or which execution mode.

Stop only in these cases:

1. A commit hook fails tests. Ask the rule 990 question. Do not change tests or product code for that gate until the user answers.
2. The isolated E2E stack is down. Report it. Do not set `SKIP_E2E`.
3. A screenshot misses 0.1% after a move. Revert that wiring. Keep the font root. Write the pixel count in this plan. Do not recapture the shot.
4. A step would delete live rows, push, or publish a theme document.

## Already on disk — do not redo

- Commits `f145dc16` through `3e98101b` are on `main`.
- Matiss sections live under `src/variants/owned/matiss/`. Home renders `VariantSurfaceEntry` inside `MatissFontRoot`.
- Liora, Mozarthitos, Mi Mundo, Espacio Zenit, and Nago each have `tokens.ts`, `document.ts`, `registry.ts`, `props.ts`, `surfaces.tsx`, `landingEntry.ts`, and `clientEntries.ts`.
- Liora and Mozarthitos also have `home/v1/`. The other section trees are still outside `src/variants/owned/<slug>/`.
- `MatissFontRoot` still applies `fraunces` and `nunito` and imports the Matiss CSS.
- Shared files still compare slugs. `src/app/[locale]/encuentra-tu-clase/page.tsx` still has `kind === "mozarthitos"`.
- PWA Task 1 (tokens, `install_theme_unreadable`, `buildTenantManifest`) is committed. `src/app/manifest.ts` is not switched yet.

## Overrides for section B

Use section B of the migrate plan, with these overrides:

1. Step 1 captures on `CLIENT_VISUAL_BASE_URL=http://<slug>.localhost:3000`. Do not point the capture at a tenant database. Hide `nextjs-portal`. Cap `img.decode()` at 3 seconds.
2. Step 6 is `npx tsx scripts/publish-theme-document.ts <slug> --dry-run`. Do not publish.
3. Step 3 deletes `<Client>FontRoot` only when `home at 1280` stays inside 0.1% without it. If the label font changes, keep the file and continue.
4. Step 9 commits that client on `main` with the normal precommit hook. Add a changelog row only when a person can see the change. CSS renames and the tab bar are visible. A photograph mask is not.

---

### Task 1: Matiss font root

**Spec marker:** `docs/superpowers/specs/2026-11-10-tenant-design-system-design.md`

**Files:**
- Modify: `src/variants/owned/matiss/font/v1/Web.tsx` only if the shot passes without the wrapper
- Test: `e2e/clients/matiss.visual.spec.ts` (run, do not recapture)

**Interfaces:**
- Consumes: `CATALOG_FONTS.fraunces` and `CATALOG_FONTS.nunito`
- Produces: either no `MatissFontRoot`, or a note that the file stays

- [ ] **Step 1: Write the gate marker**

```json
{ "spec": "docs/superpowers/specs/2026-11-10-tenant-design-system-design.md", "approvedAt": "<ISO>" }
```

Write that JSON to `.cursor/sdd-gate0-approved`.

- [ ] **Step 2: Move the font classes to the home wrapper**

Keep the CSS imports. Put `display.variable` and `body.variable` on the same node that already has `matiss-landing`. Delete `MatissFontRoot` only after the next step passes. If you delete it, update every import in `src/variants/owned/matiss/` and the tests that mock it.

- [ ] **Step 3: Compare home**

```bash
CLIENT_VISUAL_BASE_URL=http://matiss.localhost:3000 npx playwright test e2e/clients/matiss.visual.spec.ts --grep "home at 1280$" --reporter=line
```

Expected: PASS. On fail, restore `MatissFontRoot` and check this step with the note "kept".

- [ ] **Step 4: Commit only if the file set changed**

```bash
git add src/variants/owned/matiss src/__tests__
git commit -m "feat: drop the Matiss font wrapper when the catalog fonts stay on the page"
```

No changelog row when the pixels match. Do not push.

### Task 2: Liora

**Spec marker:** `docs/superpowers/specs/2026-11-10-tenant-design-system-design.md`

**Child task:** migrate plan Task C2. Home already uses `src/variants/owned/liora/home/v1/`.

**Host:** `http://liora.localhost:3000`

**Extra:** New Playwright project. Shots go to `e2e/__screenshots__/clients/liora/`. Do not move the Matiss shots.

- [ ] **Step 1: Inventory**

```bash
rg -l '"liora"' src --glob '!src/variants/owned/**' --glob '!src/__tests__/**'
```

Move only the files that still sit outside `src/variants/owned/liora/`.

- [ ] **Step 2: Run section B with the overrides**

Baseline first. Then tokens, font root, `git mv`, dry-run, compare, delete branches, guard, commit.

- [ ] **Step 3: Commit**

Message: `feat: move the Liora landing into its owned variants`. Changelog id `liora-owned-landing`, area `site`, file `045` if this is the first new row. Bump the filename if Task 1 or an earlier client already took `045`.

### Task 3: Mozarthitos

**Child task:** migrate plan Task C3.

**Host:** `http://mozarthitos.localhost:3000`

**Extra:** `pages.findClass` uses `page.find-class`. Delete `kind === "mozarthitos"` in `src/app/[locale]/encuentra-tu-clase/page.tsx` only after that page's screenshot passes.

- [ ] **Step 1: Inventory, then section B, then commit**

Message: `feat: move the Mozarthitos landing into its owned variants`.

### Task 4: Mi Mundo

**Child task:** migrate plan Task C4.

**Host:** `http://mimundo.localhost:3000`

- [ ] **Step 1: Inventory, then section B, then commit**

Message: `feat: move the Mi Mundo landing into its owned variants`. Do not implement the colonia or gallery specs.

### Task 5: Espacio Zenit

**Child task:** migrate plan Task C5.

**Host:** `http://espaciozenit.localhost:3000`

**Extra:** Keep the three owned OTF catalog entries. Do not vendor them again.

- [ ] **Step 1: Inventory, then section B, then commit**

Message: `feat: move the Espacio Zenit landing into its owned variants`.

### Task 6: Nago

**Child task:** migrate plan Task C6.

**Host:** `http://nago.localhost:3000`

**Extra:** Leave `NAGO_INSTALL_CHROME` and `bundledPublicInstallIcon` until Task 8. Do not rename `--nago-*` in a way that adds a new hardcode hit. The header spacer class stays `nago-site-header-spacer`.

- [ ] **Step 1: Inventory, then section B, then commit**

Message: `feat: move the Nago landing into its owned variants`.

### Task 7: Strict guard

**Spec marker:** `docs/superpowers/specs/2026-11-10-tenant-design-system-design.md`

**Child task:** migrate plan Tasks D1 and D2. Finish plan Task 7.

- [ ] **Step 1: One path per dispatcher**

Each dispatcher reads `pages.<id>` or `sections` from `loadPublishedThemeDocument`. There is no slug `case`.

- [ ] **Step 2: Failing test, then the guard**

Create `src/__tests__/lib/theme/noBespokeKindBranches.test.ts`. It reads the dispatcher files and fails when a slug literal remains.

```bash
npm run check:institute-hardcode -- --strict
```

Expected: exit 0. Then add `--strict` to the `precommit` script. Delete `scripts/institute-hardcode-baseline.json`. Update `.cursor/rules/53-no-institute-hardcode.mdc` and `docs/adr/2026-11-tenant-design-system.md`.

- [ ] **Step 3: Commit**

Message: `feat: reject institute slugs in shared code`. No changelog row.

### Task 8: PWA install identity

**Spec marker:** `docs/superpowers/specs/2026-11-10-pwa-install-identity-design.md`

**Child plan:** `docs/superpowers/plans/2026-11-10-pwa-install-identity.md` Tasks 2–5.

Do not redo Task 1. Do not edit `src/app/manifest.ts` until Task 3 of that plan. `#808080` must still fail `install_theme_unreadable`.

- [ ] **Step 1: Confirm Task 1**

```bash
npx vitest run src/__tests__/lib/design-tokens/validateDesignTokens.install.test.ts src/__tests__/lib/brand/shortNameFromBrand.test.ts src/__tests__/lib/pwa/buildTenantManifest.test.ts
```

Expected: PASS.

- [ ] **Step 2: Execute Tasks 2, 3, 4, and 5**

Icon upload uses `InlineUploadProgressBar`. Install colors come from `install.theme` and `install.background`. Remove `NAGO_INSTALL_CHROME` and `bundledPublicInstallIcon` in Task 3.

- [ ] **Step 3: Commit**

The child plan Task 5 already names the changelog id `pwa-install-identity`, area `portal`. Do not push.

### Task 9: Email identity

**Spec marker:** `docs/superpowers/specs/2026-11-10-email-identity-per-tenant-design.md`

**Child plan:** `docs/superpowers/plans/2026-11-10-email-identity-per-tenant.md` Tasks 1–5.

- [ ] **Step 1: Execute Tasks 1–5**

`wrapEmailHtml` takes `deriveEmailTokens`. No Golden hex remains in the wrapper. Changelog id `email-identity`, area `communications`.

- [ ] **Step 2: Commit**

Do not push.

### Task 10: Dashboard identity

**Spec marker:** `docs/superpowers/specs/2026-11-10-dashboard-identity-per-tenant-design.md`

**Child plan:** `docs/superpowers/plans/2026-11-10-dashboard-identity-per-tenant.md` Tasks 1–5.

- [ ] **Step 1: Execute Tasks 1–5**

Dashboards use `app.*` tokens. Student and parent screens keep their PWA trees. Changelog id `dashboard-identity`, area `portal`.

- [ ] **Step 2: Commit**

Do not push.

### Task 11: Scale budgets

**Spec marker:** `docs/superpowers/specs/2026-11-10-scale-1000-tenants-design.md`

**Child plan:** `docs/superpowers/plans/2026-11-10-scale-1000-tenants.md` Tasks 1–7.

- [ ] **Step 1: Execute Tasks 1–7**

This phase does not change the look of a site. No changelog row. The load test is Manual QA (user). Run it once on the isolated stack only. If that stack is down, commit the code and leave the spec line `Load test (first run)` empty. Do not point the load test at a tenant host.

- [ ] **Step 2: Commit**

Do not push.

## Self-review

- Finish-plan Tasks 1–4 and Task 5 steps 1–3 have no new work here.
- Each open client is one task. The code stays in section B of the migrate plan.
- PWA Task 1 is not repeated.
- Email, dashboard, and scale point at their own plans.
- Live publish, push, and a higher hardcode baseline are forbidden in every task.
- The three draft specs stay out of scope.
