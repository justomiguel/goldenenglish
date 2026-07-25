# Admin help — operational task tours (wave A/B/C)

**Date:** 2026-07-12  
**Status:** Approved — Phase A implemented  
**Related:**
- [`2026-07-11-admin-help-tutorials-design.md`](./2026-07-11-admin-help-tutorials-design.md)
- [`2026-07-11-admin-help-create-user-tours-design.md`](./2026-07-11-admin-help-create-user-tours-design.md)
- [`2026-07-12-admin-tours-e2e-coverage-rule-design.md`](./2026-07-12-admin-tours-e2e-coverage-rule-design.md)
- ADR `docs/adr/2026-07-admin-help-driverjs-tutorials.md`
- Rules `.cursor/rules/31-admin-tutorials-copy.mdc`, `33-admin-tutorials-contract.mdc`

## Intent

Ship **twelve** new Help FAB **task tutorials** that teach high-frequency admin operations, in **three implementation phases**, with a **catalog grouping** UX so the FAB stays scannable. Depth is **mixed by risk**: safe demos where helpful; **guide-only** (never confirm/save secrets) for irreversible or credential-sensitive actions.

## Understanding

- Task catalog today: create-cohort / section / student / teacher / admin only.
- Screen explain tours already cover list/hub chrome for blog, events, finance, etc., but **not** “how to do X” on nested create/review/settings flows.
- Shared stack: Driver.js, `ADMIN_TOUR_ANCHORS`, `startAdminTutorial`, dictionaries en/es/pt, `listTourRuntimeChecks` → Playwright `@admin-tours` (every tour must have a matrix row).
- Nested destinations need path helpers + env/seed ids for L3 (cohort, section, student, pending receipt) similar to create-section.

## Goals

1. Add 12 catalog tutorials with pedagogical copy (rule 31).
2. Organize the Help FAB task list into **visual groups** (Academic / Billing / Users / Content) without changing the Driver runner.
3. Phase delivery **A → B → C** so each PR is mergeable and fully covered (L1/L2/L3 as applicable).
4. Wire `data-tour` on real controls; optional anchors for empty states.
5. Analytics entities `admin_tutorial:<id>` (or existing convention) per tour.
6. Extend E2E seed / env only when a tour cannot smoke without fixtures.

## Non-goals

- Teacher / parent / student surface tours.
- Auto-start or “seen” checklist persistence.
- Redesigning Help into nested menus / search (grouping headings only).
- Event-payment approval as a separate tour (v1 focuses on finance **inbox** monthly/enrollment/invoice).
- Actually enabling gateways, publishing blog posts, approving/rejecting payments, or applying password resets **from the tour**.
- Bulk section scholarship matrix as a first-class tour (individual student billing is primary; optional mention only).

## Product rules (locked)

| Rule | Detail |
|------|--------|
| Delivery | One written spec; implement in phases **A → B → C**. |
| Catalog UX | Approach **C**: flat list of tutorials with **group headings** from catalog metadata (`group: academic \| billing \| users \| content`). |
| Depth | **Mixed by risk** (table below). |
| Scholarships | **Two** tutorials: partial % and full 100%. |
| v1 inventory | Exactly the 12 ids in “Tour inventory” (no open “etc”). |
| Contracts | Every new `AdminTutorialId` gets matrix row + Vitest; rule 33 applies. |
| Copy | en / es / pt; teach why, not only where. |
| Engine | Same Driver.js runner; stack-below-tour for modals when needed. |

### Depth by tour

| Mode | Tours | Allowed automation | Forbidden |
|------|--------|---------------------|-----------|
| **Guide + safe demo** | `create-event`, `take-attendance`, `assign-scholarship-percent`, `assign-scholarship-full`, `create-blog-article`, `import-users` | Navigate, open tabs/panels, fill **non-persisted** demo fields when UX already supports tour session, highlight cells | Submit/publish/approve/apply that mutates production data |
| **Guide only** | `approve-payment`, `reject-payment`, `enable-mercadopago`, `enable-flow`, `change-billing-currency`, `reset-user-password` | Navigate, open tabs, highlight controls | Click confirm on approve/reject/save credentials/apply password; paste real secrets |

## Tour inventory

### Phase A — Daily operations

| Id | Group | Primary path | Notes |
|----|-------|--------------|-------|
| `create-event` | content | `…/admin/events` → `…/events/new` | Demo-safe field fills OK; no submit. |
| `approve-payment` | billing | `…/admin/finance?tab=inbox` | Guide-only; need pending receipt or empty-state optional steps. |
| `reject-payment` | billing | same inbox | Guide-only; explain reject + confirm modal without confirming. |
| `take-attendance` | academic | `…/academic/{cohortId}/{sectionId}` attendance tab (or `/attendance`) | Requires schedule; empty-state optional. |
| `assign-scholarship-percent` | billing | `…/admin/users/{userId}` → Payments / billing scholarship panel | Demo mode %; no save. |
| `assign-scholarship-full` | billing | same | Demo 100%; no save. |

### Phase B — Configuration

| Id | Group | Primary path | Notes |
|----|-------|--------------|-------|
| `enable-mercadopago` | billing | `…/finance?tab=settings` | Guide-only; CL/AR cards; encryption key ops note in copy. |
| `enable-flow` | billing | same | Guide-only; Chile/CLP. |
| `change-billing-currency` | billing | same | Guide-only; warn institute-wide impact. |

### Phase C — Content & user security

| Id | Group | Primary path | Notes |
|----|-------|--------------|-------|
| `create-blog-article` | content | `…/cms/blog` → `…/blog/new` | Demo-safe; no publish. |
| `reset-user-password` | users | `…/users/{userId}` Security tab | Guide-only; no apply. |
| `import-users` | users | `…/users/import` (existing import UI) | Demo-safe walkthrough of CSV flow; do not complete import job as tour side effect (or use clearly labeled demo file only if already supported — prefer guide through UI without starting job). |

Existing catalog rows stay; place them under the same groups (`create-cohort` / `create-section` → academic; create-*-user → users).

## Catalog grouping (FAB)

1. Extend `AdminTutorialCatalogEntry` with `group: "academic" | "billing" | "users" | "content"`.
2. `AdminHelpTutorialList` renders group heading (dict `dashboard.adminHelpCatalogGroups.*`) then rows.
3. Order within group: stable product order defined in `CATALOG` array (not alpha).
4. Explain-this-screen block remains **above** the grouped task list.

## Architecture (per tour — mandatory)

Same checklist as rule 31 + 33:

1. `AdminTutorialId` + `CATALOG` row (`icon`, `group`, `catalogKey`).
2. Pure step builder under `src/lib/admin-tutorials/`.
3. Client starter + `startAdminTutorial` switch case.
4. `ADMIN_TOUR_ANCHORS` + JSX `data-tour` on real controls.
5. Dict: `adminHelpCatalog.<id>` + `adminHelpTours.<camel>` (en/es/pt).
6. Vitest: catalog contract, step order, runner smoke (mocked Driver).
7. `listTourRuntimeChecks` row (`task:<id>`) with always-visible anchors; env skips when seed ids missing.
8. Analytics entity for start/complete (existing tutorial pattern).

Shared helpers preferred over per-tour forks:

- Finance settings tab ensure path.
- Inbox ensure path + optional “no pending receipts” popover.
- Resolve target student / section from env or first eligible (document in starter; prefer env for E2E: `E2E_STUDENT_ID`, existing `E2E_COHORT_ID` / `E2E_SECTION_ID`).

## L3 / seed expectations

| Tour | L3 path smoke | Extra env / seed |
|------|---------------|------------------|
| create-event | `/events/new` form anchors | none |
| approve/reject-payment | finance inbox workspace (+ optional row actions if seeded pending) | Prefer seed pending receipt; if absent, only always-visible inbox chrome required |
| take-attendance | section attendance matrix or empty-state anchors | `E2E_COHORT_ID`, `E2E_SECTION_ID` (schedule already in e2e seed) |
| scholarships | student billing scholarship panel | `E2E_STUDENT_ID` (or document skip) |
| MP / Flow / currency | finance settings cards / currency field | none (cards visible without credentials) |
| blog | `/cms/blog/new` editor chrome | none |
| reset password | user security panel | `E2E_STUDENT_ID` or admin-editable user id |
| import-users | import page anchors | none |

## Phased DoD

### Phase A done when

- Six Phase A tours playable from FAB with anchors + copy.
- Catalog groups visible (at least academic + billing + users + content headings for existing + new rows).
- Vitest + matrix rows green; isolated `@admin-tours` covers new rows (skips when env insufficient).

### Phase B done when

- [x] Three settings tours on finance settings tab; guide-only enforced in runners (no save clicks).
- [x] Catalog + dict en/es/pt + matrix rows + Vitest contracts green.

### Phase C done when

- [x] Blog, reset-password, import-users tours complete same contracts.
- [x] Spec checklist below fully checked.

## Risks and mitigation

| Risk | Mitigation |
|------|------------|
| FAB overwhelm | Group headings; keep blurbs outcome-focused |
| Empty inbox / no schedule | Optional anchors + in-tour empty explainer |
| Nested navigation flaky in E2E | Reuse create-section path patterns; seed ids in `.env.local.e2e` |
| Accidental mutations | Guide-only runners never call confirm/save; Vitest asserts no mutation action invoked |
| Large PR | Hard phase gates A→B→C |

## Manual QA (user)

Per phase: play each new tour once on a tenant or isolated stack; confirm no unintended saves/approvals; check empty-state messaging.

## Open follow-ups (explicitly out of v1)

- Event payment approval tour.
- Section bulk scholarship tour.
- Site-setup currency tour (finance settings is canonical post-setup).
- Assistant/teacher-as-blog-author differences.

## Approval

Reply **go ahead** / **ok** on this file to unlock implementation starting with **Phase A**.
