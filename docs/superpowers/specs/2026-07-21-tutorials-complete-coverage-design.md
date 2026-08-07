# Tutorials — complete coverage (admin gaps + parent L3)

**Date:** 2026-07-21  
**Status:** Approved (user: “hagamos el plan y arranquemos”)  
**Related:**
- Parent v1: `docs/superpowers/specs/2026-07-12-parent-portal-guided-tours-design.md`
- Admin operational waves: `docs/superpowers/specs/2026-07-12-admin-help-operational-task-tours-design.md`
- Admin explain sidebar: `docs/superpowers/specs/2026-07-11-admin-help-explain-all-sidebar-screens-design.md`
- Rules: `31`/`33` (admin), `35`/`36` (parent)

## Intent

Close **every documented tutorial gap**: parent L3 Playwright, parent task polish, four admin follow-up task tours, nested admin explain tours, and orphan admin routes — without regressing L1/L2 contracts.

## Understanding

- **Admin v1** (21 explain + 17 task) is complete per approved specs.
- **Parent v1** (12 explain + 7 task) is implemented in product code but **L3 `@parent-tours` is missing**; matrix rows lack `pathFor` + always-visible anchors (admin parity).
- Specs explicitly defer **four admin task tours**, **nested route explains**, and **retention/requests/payments** hubs.
- Parent `parent-manage-child-or-tutor-profile` task targets Settings, not ward profile; billing route redirects to `payments?tab=fees`; some anchors (`billing*`, `profileForm`) are not wired in JSX.

## Goals

1. **Phase 1 — Parent L3:** Upgrade `listParentTourRuntimeChecks` (path + anchors), fix missing anchors / billing path resolution, add `e2e/parent-tours.spec.ts` + Playwright project, runbook note.
2. **Phase 2 — Parent task polish:** Ward profile task navigates to `children/[studentId]` when a ward exists; differentiate copy from settings-notifications tour.
3. **Phase 3 — Admin follow-up tasks (4):** Event payment approval, section bulk scholarship, site-setup currency change, blog author role variant (assistant/teacher).
4. **Phase 4 — Nested admin explain tours:** High-traffic nested routes (users/new, users/import, events/new, messages/compose, user detail hub, blog editor, cohort/section attendance, settings/integrations, finance sub-hubs as needed).
5. **Phase 5 — Orphan admin routes:** Explain tours for `/admin/retention`, `/admin/requests`, `/admin/payments` when product keeps those entry points.

## Non-goals

- Student / teacher portal tours.
- Auto-start tours, persisted checklist, Help search tab.
- Actually mutating data from guide-only tours.

## Product rules

| Rule | Detail |
|------|--------|
| Contracts | Every new tour id → catalog + dict en/es/pt + matrix row + Vitest L1/L2; admin/parent L3 on isolated stack only |
| Depth | Follow operational spec: guide-only vs demo-safe per tour risk |
| Explain scope | Nested explains remain **content-only**; only hub home tours use chrome |
| i18n | All visible copy via dictionaries |

## Phased definition of done

### Phase 1 done when

- [ ] `listParentTourRuntimeChecks` exposes `pathFor` + `anchors` for every parent screen/task id.
- [ ] Missing parent anchors wired (`profileForm`, billing/fees tab).
- [ ] `resolveParentScreenTour` matches billing intent (`/billing` redirect + `payments?tab=fees`).
- [ ] `e2e/parent-tours.spec.ts` tagged `@parent-tours` using parent storage state.
- [ ] Playwright project + precommit picks up spec; runbook documents parent env.

### Phase 2–5 done when

Each phase ships full stack (anchors, builders, dict, matrix, tests, L3 rows where applicable) per phase checklist in the implementation plan.

## Risks

| Risk | Mitigation |
|------|------------|
| Large scope | Strict phase gates; one PR slice per phase if needed |
| E2E flakiness | Same cold-reload pattern as `admin-tours.spec.ts` |
| Billing redirect | Align resolver + L3 path to `payments?tab=fees` |

## Manual QA (user)

After each phase: play one new/changed tour on desktop; parent phase also spot-check PWA home explain.
