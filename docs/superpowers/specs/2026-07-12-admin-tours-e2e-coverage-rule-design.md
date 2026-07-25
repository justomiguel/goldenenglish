# Admin tours — full L3 E2E coverage + mandatory “every tour has a test” rule

**Date:** 2026-07-12  
**Status:** Approved  
**Related:**
- `.cursor/rules/33-admin-tutorials-contract.mdc`
- `.cursor/rules/31-admin-tutorials-copy.mdc`
- `.cursor/rules/34-precommit-e2e.mdc`
- `docs/runbooks/e2e-isolated-harness.md`
- Specs: `2026-07-11-admin-help-explain-all-sidebar-screens-design.md`, `2026-07-11-e2e-isolated-harness-design.md`

## Understanding

- Screen explain tours (~21 ids in `screenCatalog.ts`) and task tutorials (`catalog.ts`: create-cohort / section / student / teacher / admin) already exist with Vitest L1/L2 and dictionary contracts.
- Playwright L3 (`e2e/admin-tours.spec.ts`) iterates **`listTourRuntimeChecks()`** — today that matrix only covers **5 screens** (home, users, glossary, academic, profile) + **3 tasks** (create-cohort, create-section, create-user). Most sidebar explain tours have **no** live-route E2E.
- Adding rows to `listTourRuntimeChecks` automatically expands `@admin-tours` without rewriting the Playwright loop.
- Product already forbids tenant DBs for L3; isolated stack + seeded admin remains the only path.

## Intent

1. **Every registered admin tour** (every `AdminScreenTourId` + every `AdminTutorialId`) has an L3 smoke entry in `listTourRuntimeChecks` (required, always-visible anchors only).
2. **Cursor rule** makes that mandatory for future tours (update `33` + checklist in `31`).
3. **Vitest contract** fails if a catalog/screen tour id is missing from the runtime matrix (so the rule is mechanical, not honor-system).

## Done when

- [x] `listTourRuntimeChecks()` includes one `screen:<AdminScreenTourId>` per screen tour, with path from `adminHomePath` / `adminScreenPath` / `adminProfilePath` and **non-optional** anchors derived from tour step defs (`CONTENT_ONLY_SCREEN_TOUR_DEFS` + admin-home builder).
- [x] Every `AdminTutorialId` maps to a `task:*` runtime check (explicit `task:create-student` / `task:create-teacher` / `task:create-admin` sharing create-user path/anchors).
- [x] Vitest: “every screen tour id + every tutorial id appears in `listTourRuntimeChecks`”; anchors remain ⊆ `ADMIN_TOUR_ANCHORS`; optional tour steps are **not** required in L3.
- [x] `e2e/admin-tours.spec.ts` still drives from the matrix (no hard-coded tour list in the spec); all new rows run on isolated stack.
- [x] `.cursor/rules/33-admin-tutorials-contract.mdc` states: **new tour ⇒ update matrix + L1/L2 as today + L3 via matrix**; checklist item “every tour has a runtime check / @admin-tours smoke”.
- [x] `.cursor/rules/31-admin-tutorials-copy.mdc` architecture checklist adds the same L3/matrix requirement for new tours.

## Out of scope

- Driving full Driver.js click-through (Next/Done) in Playwright for every tour (L3 stays **anchor visibility** on the live route, same as today).
- Nested detail routes without a registered screen tour.
- Extending L2 RTL mounts for every screen in this change (L1 inventory + L3 matrix are enough for the gap; L2 may follow if a shell is missing fixtures).
- Changing tour copy, anchors, or product UX.
- Pointing E2E at `dev:nago` / tenant DBs.

## Proposed plan

1. **Helper** — e.g. `requiredAnchorsFromContentOnlyDefs(id)` (or generate screen checks from `CONTENT_ONLY_SCREEN_TOUR_DEFS`) so new content-only tours inherit L3 when defs + catalog ship together.
2. **Expand** `listTourRuntimeChecks` for all screens + missing task ids; keep create-section gated on `E2E_COHORT_ID`.
3. **Vitest** — extend `listTourRuntimeChecks.test.ts` with full-coverage contract + path smoke samples.
4. **Rules** — update `33` and `31` with the mandatory “every tour → runtime check → @admin-tours” contract.
5. **Verify** — Vitest for the matrix; note Manual QA / full `test:e2e:precommit` remains user-owned when stack is up (`32`).

## Risks and mitigation

| Risk | Mitigation |
|------|------------|
| Heavy screens slow / flake L3 (site-setup, CMS, finance) | Same pattern as today: wait on first anchor + one reload; timeout 15s; only always-visible anchors |
| Optional / empty-state anchors fail on empty seed | Exclude `optional: true` steps from required L3 anchors |
| Create-user role-specific fields | Keep email/guardian out of required set (existing create-user pattern) |
| Precommit time grows with ~20 routes | Acceptable; suite already multi-project; anchors-only visits stay lighter than full critical flows |

## Definition of done

- Mechanical Vitest contract: **no tour without a matrix row**.
- Playwright `@admin-tours` covers all matrix rows on isolated stack.
- Rules `33` / `31` document the requirement for agents/humans.
- No tenant-DB E2E guidance introduced.

## Manual QA (user)

- With `e2e:stack:up` + `.env.local.e2e`, run `npm run test:e2e:precommit` (or at least the `chromium-admin-tours` project) and confirm new screen routes pass.
