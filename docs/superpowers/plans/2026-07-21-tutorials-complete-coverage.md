# Plan — Tutorials complete coverage

**Spec:** `docs/superpowers/specs/2026-07-21-tutorials-complete-coverage-design.md`

## Phase 1 — Parent L3 (start here)

| Step | Files |
|------|-------|
| 1 | `screenCatalog.ts` — `parentScreenPath`, `parentChildDetailPath`, billing resolver fix |
| 2 | `listTourRuntimeChecks.ts` — admin-style `pathFor` + `anchors` |
| 3 | UI anchors — profile form, billing/fees on `ParentPaymentsEntry` / `BillingPortalScreen` |
| 4 | `e2e/parent-tours.spec.ts` + `playwright.config.ts` project |
| 5 | Tests — `listTourRuntimeChecks.test.ts`, fix `tourCatalogContract` screen id loop |
| 6 | `docs/runbooks/e2e-isolated-harness.md` — parent L3 note |

**Verify:** `npx vitest run src/__tests__/lib/parent-tutorials/listTourRuntimeChecks.test.ts`

## Phase 2 — Parent ward profile task

- `buildParentTaskTourSteps.ts` — `parent-manage-child-or-tutor-profile` → `children/[studentId]` when env/student available
- `startParentTutorial.ts` — wait anchor on child detail
- Dict copy update en/es/pt
- Matrix env `E2E_STUDENT_ID` for task row
- Vitest + L3 row

## Phase 3 — Admin follow-up tasks (4)

| Id | Group | Notes |
|----|-------|-------|
| `approve-event-payment` | billing | Finance or events payment review; guide-only |
| `assign-section-scholarship-bulk` | billing | Section collections / bulk scholarship UI |
| `change-site-setup-currency` | billing | Site setup wizard currency step |
| `create-blog-article-as-teacher` | content | Role-specific path or copy branch on existing blog tour |

Each: catalog, builder, starter, anchors, dict, matrix, Vitest, `@admin-tours` row.

## Phase 4 — Nested admin explain tours

Prioritized nested routes (content-only):

1. `admin-users-new`, `admin-users-import`
2. `admin-events-new`, `admin-event-detail`
3. `admin-messages-compose`, `admin-message-detail`
4. `admin-user-detail`, `admin-user-billing`
5. `admin-blog-new`, `admin-blog-edit`
6. `admin-cohort-detail`, `admin-section-attendance`
7. `admin-settings-integrations`
8. Finance sub-routes as product requires (`collections`, `receipts`)

Pattern: extend `AdminScreenTourId`, `screenCatalog` longest-prefix match, `CONTENT_ONLY_SCREEN_TOUR_DEFS`, dict, anchors, matrix.

## Phase 5 — Orphan admin explains

- `admin-retention`, `admin-requests`, `admin-payments-legacy` (if routes stay public)
- Sidebar registration only if product adds nav links

## Verification (each phase)

```bash
npx vitest run src/__tests__/lib/parent-tutorials src/__tests__/lib/admin-tutorials
# after L3 changes:
npm run test:e2e:precommit  # user env; SKIP_E2E=1 only if user allows
```
