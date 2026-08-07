# Parent / tutor portal — guided tours (explain + tasks)

**Date:** 2026-07-12  
**Status:** Approved  
**Related:**
- Admin foundation: [`2026-07-11-admin-help-explain-screen-design.md`](./2026-07-11-admin-help-explain-screen-design.md), [`2026-07-11-admin-help-explain-all-sidebar-screens-design.md`](./2026-07-11-admin-help-explain-all-sidebar-screens-design.md)
- ADR `docs/adr/2026-07-admin-help-driverjs-tutorials.md` (Driver.js engine; amend or sibling ADR for parent surface)
- Rules: `.cursor/rules/31-admin-tutorials-copy.mdc`, `.cursor/rules/33-admin-tutorials-contract.mdc`, `.cursor/rules/05-pwa-mobile-native.mdc`
- Tier A shells: `ParentDashboardShellClient`, `ParentPwaShell`, `ParentPwaTabBar`, `buildParentSidebarNavGroups`

## Intent

Parents and tutors can discover and learn **every primary option** in their portal via Driver.js tours, on **both desktop and mobile/PWA**, with:

1. **Explain this screen** — contextual walkthrough of the current route.
2. **Task tutorials** — guided how-to flows for critical family actions (payments, progress, messages, child profile, calendar/attendance, badges, settings).

## Understanding

- Admin already ships Help FAB + explain/task tours under `src/lib/admin-tutorials/` with L1/L2 Vitest contracts and L3 Playwright on the isolated E2E stack.
- Parent portal is **Tier A**: distinct desktop (sidebar) and mobile/PWA (header + bottom tab bar) trees via `useAppSurface()` / surface gates.
- Parent has **no** help launcher or tours today.
- Primary nav (sidebar + tab bar): home, calendar, progress, payments (conditional), messages, settings; profile via header / “You” group.
- Secondary hubs (reachable from home/progress/payments): billing, tasks, assessments, badges, child detail (`children/[studentId]`).

## Locked product decisions

| Decision | Choice |
|----------|--------|
| Tour types | **Both** explain-screen + task tutorials |
| Surface model | **One tour id per screen/task**; step builders emit surface-tagged steps; runtime keeps `desktop` / `mobile` / `both` for current `useAppSurface()` |
| Explain coverage | Nav principal **+** secondary hubs (not payment gateway return routes or task-instance detail) |
| Task pack (v1) | **Full pack (6+)** — see inventory below |
| Architecture | Parallel bounded context `src/lib/parent-tutorials/`; reuse shared Driver runner helpers from admin client stack (do **not** fold parent into `admin-tutorials`) |

## Goals

1. Mount a **Parent Help FAB** on desktop and PWA parent shells (thumb-safe on mobile; AA contrast; Lucide leading icons).
2. Register **explain tours** for every in-scope parent route; home is the only `chrome-and-content` tour.
3. Ship **task tutorials** covering payments, learning progress/tasks, messaging, ward/tutor profile, calendar/attendance, badges, and settings/notifications.
4. Keep copy pedagogical (teach why + how) in **en / es / pt** dictionaries.
5. Mirror admin staleness contracts: L1 inventory + L2 DOM presence + L3 `@parent-tours` on isolated E2E only.
6. Emit analytics `parent_screen_tour:*` / `parent_tutorial:*` (extend event constants + route schema as required by **08**).

## Non-goals

- Auto-start on first visit or persisted “seen” checklist.
- Help chat / command-palette search inside the parent FAB (admin Search tab is staff-only).
- Student or teacher portal tours.
- Explaining MP/Flow return pages or deep task-instance detail (`tasks/[taskInstanceId]`).
- Large refactor extracting a multi-role `guided-tours` package (follow-up if duplication hurts).
- Changing parent information architecture or adding nav items solely for tours.

## Product rules

| Rule | Detail |
|------|--------|
| Primary CTA | Help panel always leads with **Explain this screen** when a tour matches `pathname`. |
| Home scope | `parent-home` = **chrome-and-content** (sidebar **or** tab bar + header actions, then content). |
| Other explain tours | **content-only** — do not re-highlight global chrome. |
| Surface filter | Steps declare `surfaces: ("desktop" \| "mobile" \| "both")[]` (or equivalent); missing surface anchors are skipped like optional DOM. |
| Optional anchors | Empty states, no-wards, payments disabled (`includePayments === false`), conditional cards: mark optional; runner skips if absent. |
| Payments gated | When payments nav is hidden, payments explain CTA is unavailable on that route; task “pay” tutorial either navigates with a dict empty-state or is filtered from catalog when payments are off for the tenant/session. |
| Step budget | Prefer **4–8** steps per explain tour; cap ~10. Task tours may be longer if multi-route. |
| Engine | Driver.js via dynamic import; reuse popover token CSS pattern (parent-scoped class if needed, e.g. `.ge-parent-tour-popover`). |
| Copy | Teach hierarchy (family → child → section/progress/payments); 2–4 sentences on conceptual steps; `\n\n` for paragraphs. |
| i18n | Keys in `en.json` + `es.json` + `pt.json` under `dashboard.parentHelp*` namespaces. |
| Post-mutation | Tours do not invent mutations; if a task tour opens a real form, follow existing refresh/audit rules for any write path (tours should prefer spotlight + navigate, not silent submits). |

## Screen inventory (explain)

Base = `/{locale}/dashboard/parent` unless noted.

| Tour id | Path | Scope |
|---------|------|-------|
| `parent-home` | `…/parent` (exact) | **chrome-and-content** |
| `parent-calendar` | `…/parent/calendar` | content-only |
| `parent-progress` | `…/parent/progress` | content-only |
| `parent-payments` | `…/parent/payments` | content-only |
| `parent-messages` | `…/parent/messages` | content-only |
| `parent-settings` | `…/parent/settings` | content-only |
| `parent-profile` | `/{locale}/dashboard/profile` when session role is parent/tutor **or** when opened from parent shell | content-only |
| `parent-billing` | `…/parent/billing` | content-only |
| `parent-tasks` | `…/parent/tasks` (list; exact / trailing slash — **not** `[taskInstanceId]`) | content-only |
| `parent-assessments` | `…/parent/assessments` | content-only |
| `parent-badges` | `…/parent/badges` | content-only |
| `parent-child-detail` | `…/parent/children/[studentId]` | content-only |

**Out of path matching:** `…/payments/mp-return`, `…/payments/flow-return`, `…/tasks/[taskInstanceId]`. CTA disabled / muted empty copy on those routes.

**Profile note:** Prefer matching profile when the help launcher is mounted from the parent layout only (parent shells), so staff dual-role on `/dashboard/profile` keeps admin explain if admin launcher is present. If both launchers cannot coexist, mount **only** the launcher for the active dashboard layout.

## Task tutorial inventory (v1)

| Tutorial id | Learning outcome | Typical routes / anchors |
|-------------|------------------|---------------------------|
| `parent-pay-or-upload-receipt` | Find due amounts, start gateway or upload receipt | payments (+ optional billing tab) |
| `parent-view-child-progress` | Switch child, open progress / tasks / assessments | home child switcher → progress / tasks |
| `parent-read-reply-messages` | Open inbox, read thread, compose | messages |
| `parent-manage-child-or-tutor-profile` | Open ward profile / edit guardian-visible fields | children/[id] and/or settings / profile |
| `parent-calendar-attendance` | Read schedule and attendance signals | calendar (+ home attendance pillar if present) |
| `parent-badges-overview` | See earned badges / meaning | badges (via progress hub if needed) |
| `parent-settings-notifications` | Review reminder / notification prefs | settings |

Catalog may hide entries when prerequisites fail (e.g. no linked children) with dict-backed disabled reason — prefer show + explain empty state over silent omission when pedagogically useful.

## UX

### Help panel order

1. **Explain this screen** block (title, blurb, primary Map/ScanSearch button; disabled + muted when no match).
2. Divider.
3. **Task tutorials** list (Lucide icons per catalog row; Play starts tour and closes panel).

### Chrome teaching (home only)

**Desktop:** intro → sidebar root / groups → header (profile / sign-out as present) → home content regions (family switcher, status pillars, inbox/billing CTAs).

**Mobile/PWA:** intro → bottom tab bar → header profile / sign-out → same content regions (PWA home layout).

### Placement

- Desktop: FAB patterned after admin (corner, non-blocking).
- PWA: FAB above tab bar with safe-area padding; min 44×44 touch target; does not obscure primary tab labels.

## Architecture

```
src/lib/parent-tutorials/
  catalog.ts                 # ParentTutorialId + icons + catalogKey
  screenCatalog.ts           # pathname → ParentScreenTourId + scope
  selectors.ts               # PARENT_TOUR_ANCHORS (stable data-tour ids)
  screenTourDefs.ts          # content-only + home defs with surface tags
  listTourRuntimeChecks.ts   # matrix for L1/L2/L3
  <task>Tour.ts              # pure step builders per task
  client/
    startParentTutorial.ts
    startExplainParentScreenTour.ts
    (reuse waitForSelector / filterTourStepsForDom / runDriverTour
     — prefer importing shared helpers; if admin client is too coupled,
     extract thin shared module in the same PR without renaming admin public API)

UI:
  ParentHelpLauncher (+ Explain block + Tutorial list; reuse molecules where identical)
  Mount in ParentDashboardShellClient + ParentPwaShell

Tests:
  src/__tests__/lib/parent-tutorials/**  (self-contained; L1 inventory + L2 DOM)
  e2e/*parent*tours*.spec.ts             (@parent-tours; isolated stack + parent seed)
```

### Surface resolution

At tour start, resolve surface once:

- `web-desktop` → treat as `desktop`
- `web-mobile` | `pwa-mobile` → treat as `mobile`

Filter steps before Driver; skip optional missing anchors.

### Anchors

Centralize in `PARENT_TOUR_ANCHORS`. JSX uses literal `data-tour={PARENT_TOUR_ANCHORS.*}` or static string matching the constant. Inventory L1 fails on drift / orphans.

## Observability & governance

- Analytics entities: `parent_screen_tour:<id>`, `parent_tutorial:<id>` (mirror admin prefixes; update `eventConstants` / ingest Zod / migration if enum constrained).
- ADR: short amendment or sibling under `docs/adr/` documenting parent Help FAB + reuse of Driver.js + analytics prefixes (**10**).
- Cursor rules: add parent-tutorials copy + contract rules (or extend 31/33 with parent globs and namespaces) so UI edits keep tours green.
- Logging: client warn on missing required anchors (`[ge:client]`); no PII in meta.

## Testing strategy

| Layer | Mechanism | Gate |
|-------|-----------|------|
| L1 | Anchor inventory + catalog/dict contract + `listTourRuntimeChecks` | Precommit Vitest |
| L2 | RTL mount of parent shells / screen fixtures with required anchors | Precommit Vitest |
| L3 | Playwright `@parent-tours` iterating runtime matrix on **isolated** E2E stack with parent seed credentials | Precommit E2E (`test:e2e:precommit`); never tenant DBs |

New screen or task tour **must** add a matrix row. Seed: extend `supabase/seeds/e2e/` with a parent/tutor + at least one ward so DOM anchors exist (document env vars in e2e runbook).

## Risks & mitigation

| Risk | Mitigation |
|------|------------|
| Dual UI trees → missing mobile anchors | Surface-tagged steps + L2 fixtures for both shells |
| Payments / empty family states | Optional anchors + catalog gating + empty-state copy |
| Profile route shared with staff | Launcher only from parent layout; avoid dual FABs |
| Bundle / Driver on Tier A | Dynamic import only on start; no eager Driver |
| Scope size (12 explain + 7 tasks) | Ship in one epic but implement **vertical slices** (home explain + launcher first, then screens, then tasks); DoD requires full inventory unless a follow-up spec explicitly defers named ids |
| Staleness vs admin rules | Sibling contract rule + matrix tests |

## Implementation phasing (plan-level; after approval)

1. Scaffold `parent-tutorials` + shared runner reuse + dictionaries namespaces + ADR.
2. `ParentHelpLauncher` on desktop + PWA; home explain only (chrome-and-content).
3. Remaining content-only explain tours + anchors on screens.
4. Task tutorials (order: payments → progress → messages → child profile → calendar → badges → settings).
5. L1/L2 contracts green; L3 `@parent-tours` + e2e parent seed.
6. Cursor rules + runbook notes.

## Definition of done

- [ ] Spec approved + `.cursor/sdd-gate0-approved` points at this file.
- [ ] Help FAB on parent desktop and PWA shells; Explain CTA for every inventory route; muted on out-of-scope nested routes.
- [ ] `parent-home` teaches chrome for the active surface; all other explain tours content-only.
- [ ] All seven task tutorials startable from the catalog (or explicitly gated with dict reason).
- [ ] en/es/pt copy for launcher, catalog, screen tours, task tours.
- [ ] Analytics prefixes wired; ADR written.
- [ ] L1 + L2 Vitest green; L3 parent tours on isolated stack; runbook/seed documented.
- [ ] Parent tutorials contract rule(s) in `.cursor/rules/`.
- [ ] Manual QA checklist (user-owned): desktop + mobile home explain; one task tour; payments-off tenant; no-child empty state.

## Manual QA checklist (user)

1. Desktop parent home: FAB → Explain covers sidebar + content.
2. Narrow / PWA: FAB → Explain covers tab bar + header + content.
3. Open each inventory screen: Explain enabled and highlights main regions.
4. Run payments and messages task tours end-to-end without console errors.
5. Tenant/session without payments: payments nav absent; catalog behavior matches gated rule.
6. Contrast / touch targets on FAB and Driver popover (AA).

## Open implementation notes (non-blocking)

- Exact shared-module extraction (`runDriverTour` import path) chosen during plan to avoid breaking admin public API.
- Whether `parent-profile` uses `/dashboard/profile` vs a parent-only profile page: follow current product (profileHref already points at `/dashboard/profile`).
- Icon set for catalog: Lucide only (**16**).
