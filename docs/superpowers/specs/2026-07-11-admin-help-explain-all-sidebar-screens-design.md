
# Admin help — explain tours for every sidebar screen

**Date:** 2026-07-11  
**Status:** Approved  
**Related:**
- [`2026-07-11-admin-help-explain-screen-design.md`](./2026-07-11-admin-help-explain-screen-design.md) (hub + registry foundation)
- [`2026-07-11-admin-help-tutorials-design.md`](./2026-07-11-admin-help-tutorials-design.md)
- ADR `docs/adr/2026-07-admin-help-driverjs-tutorials.md`
- Rule `.cursor/rules/31-admin-tutorials-copy.mdc`

## Intent

Staff can open the Help FAB on **every top-level admin sidebar destination** and run **“Explain this screen”**. Each tour teaches the **main column content only** (not header chrome or sidebar — those stay exclusive to the admin-home tour).

## Understanding

- Hub home already ships `admin-home` with scope `chrome-and-content`.
- `screenCatalog.ts` / `startExplainScreenTour.ts` / `AdminHelpExplainScreenBlock` already support path → tour; other routes currently return `null` (disabled CTA).
- Sidebar destinations come from `buildAdminSidebarNavGroups` (~20 top-level hrefs, plus conditional email templates + blog).
- Product rule already locked: future screen tours = **`content-only`**.

## Goals

1. Register a **content-only** explain tour for **every** first-level sidebar item (including conditional nav items when those routes exist).
2. Keep the Help panel UX unchanged: Explain CTA first; task tutorials below.
3. Teach with dictionary copy (en / es / pt) per `.cursor/rules/31-admin-tutorials-copy.mdc`.
4. Wire `data-tour` anchors on real content regions; skip optional missing anchors.
5. Extend analytics entity prefix `admin_screen_tour:<id>` per tour.

## Non-goals

- Nested detail routes (`/users/[id]`, `/events/[id]`, cohort/section detail, compose message, badge edit, etc.).
- Re-touring sidebar or top header on any of these screens.
- Auto-start on first visit; persisted “seen” checklist.
- Student / parent / teacher surfaces.
- Changing task tutorials (`create-cohort`, `create-section`).

## Product rules (locked)

| Rule | Detail |
|------|--------|
| Scope | All new tours: `content-only`. Only `admin-home` remains `chrome-and-content`. |
| Match | Exact top-level path (optional trailing slash). Nested paths do **not** inherit parent tour. |
| Finance | Match `…/admin/finance` regardless of `?tab=` / `cohort` / `year` query. |
| Conditional nav | Register tours for email templates + blog; if staff cannot open the route, they never see the CTA enabled there. |
| My profile | Match `/{locale}/dashboard/profile` (sidebar “My profile”). Content-only; do not explain dual-role / sign-out chrome already covered on hub. |
| Step budget | Prefer **4–8 steps** per screen (intro + key regions). Cap ~10. |
| Optional anchors | Empty states, conditional panels, dual-role-only blocks: mark optional; runner skips if absent. |
| Copy | Teach why the region exists; 2–4 sentences on conceptual steps. |

## Screen inventory (in scope)

Base = `/{locale}/dashboard/admin` unless noted.

| Tour id | Path | Archetype | Scope |
|---------|------|-----------|-------|
| `admin-home` | `…/admin` | Hub | **chrome-and-content** (exists) |
| `admin-users` | `…/admin/users` | List + section subnav | content-only |
| `admin-registrations` | `…/admin/registrations` | List | content-only |
| `admin-events` | `…/admin/events` | List + create CTA | content-only |
| `admin-finance` | `…/admin/finance` | Tabbed hub | content-only |
| `admin-academic` | `…/admin/academic` | Hub + cohort board | content-only |
| `admin-calendar` | `…/admin/calendar` | Schedule board | content-only |
| `admin-contents` | `…/admin/academic/contents` | Tabbed hub | content-only |
| `admin-badges` | `…/admin/badges` | List + category tabs | content-only |
| `admin-coupons` | `…/admin/coupons` | Form + table | content-only |
| `admin-promotions` | `…/admin/promotions` | Form + table | content-only |
| `admin-messages` | `…/admin/messages` | Mailbox tabs | content-only |
| `admin-email-templates` | `…/admin/communications/templates` | Split editor | content-only |
| `admin-blog` | `…/admin/cms/blog` | Card list | content-only |
| `admin-glossary` | `…/admin/glossary` | Reference | content-only |
| `admin-analytics` | `…/admin/analytics` | Charts hub | content-only |
| `admin-audit` | `…/admin/audit` | Filtered list | content-only |
| `admin-cms` | `…/admin/cms` | Destination hub | content-only |
| `admin-site-setup` | `…/admin/site-setup` | Wizard | content-only |
| `admin-settings` | `…/admin/settings` | Form stack | content-only |
| `admin-profile` | `/{locale}/dashboard/profile` | Profile form | content-only |

**Out of path matching:** `…/users/new`, `…/users/import`, `…/events/new`, `…/calendar/special`, `…/settings/integrations`, academic `/{cohortId}`, etc. — CTA disabled until a future nested-tour spec.

## UX per tour (pattern)

1. **Intro** (`anchor: null`) — what this screen is for in the institute workflow.
2. **Title / lead** — page purpose.
3. **Primary CTA or tabs** — create / compose / tab switcher when present.
4. **Filters / toolbar** — search, role chips, cohort/year, etc.
5. **Main workspace** — table, board, matrix, chart cluster, wizard step, or form.
6. **Done** — short reminder that Help FAB stays available; optional pointer to related task tutorials when relevant (e.g. academic → create-cohort).

Do **not** highlight: sidebar links, header back-to-site / sign-out / language / teacher switch, command palette, Help FAB itself.

### Suggested regions (implementation may trim)

| Tour | Core anchors (illustrative) |
|------|------------------------------|
| users | subnav, title, search, role filter, table, pagination |
| registrations | title, toolbar, table, row actions, pagination |
| events | title, KPIs, create CTA, table, pagination |
| finance | header, tabs, cohort/year, KPI strip, active tab panel (collections or inbox as default highlight) |
| academic | title, new cohort, board tabs, cohort list / current panel |
| calendar | title, filters, legend, schedule board |
| contents | title, tabs, repository list **or** routes grid (one step each) |
| badges | header, create, category tabs, table |
| coupons | title, create form, table |
| promotions | title, create form, table |
| messages | title, compose, filters, tabs, list |
| email-templates | title, template select, editor, preview, save |
| blog | title, create, article list |
| glossary | title, hierarchy, term groups |
| analytics | title, traffic, map or charts cluster (group dense charts) |
| audit | title, toolbar, table, pagination |
| cms | title, templates card, blog card (optional) |
| site-setup | step indicator, active panel, nav buttons |
| settings | title, inscriptions, class reminders, blog translate |
| profile | title, avatar, personal form, password (optional student sections) |

## Architecture

```
src/lib/admin-tutorials/
  screenCatalog.ts              # extend AdminScreenTourId + resolveAdminScreenTour
  selectors.ts                  # ADMIN_TOUR_ANCHORS entries for all screens
  explainAdminHomeTour.ts       # unchanged
  explainUsersTour.ts           # one pure builder per screen (or grouped by domain folder)
  explainRegistrationsTour.ts
  …                             # keep ≤250 lines/file; split if needed
  client/startExplainScreenTour.ts  # switch on tour id → build steps

UI pages / organisms:
  Add data-tour={ADMIN_TOUR_ANCHORS.*} on wrappers (no business logic in tour modules)

Dictionaries:
  dashboard.adminHelpScreenTours.<metaKey>.meta.{title,description}
  dashboard.adminHelpScreenTours.<metaKey>.steps.*
```

### Path matching

- Pure `resolveAdminScreenTour(pathname, locale)`.
- Prefer longest-prefix / exact segment match so `…/academic/contents` does **not** resolve as `admin-academic`.
- Strip trailing slash; ignore search params except that finance ignores them for matching.

### Implementation approach (recommended)

**Batch one PR** with:

1. Catalog + resolver tests for all ids.
2. Shared helpers for intro/done step shapes.
3. Per-screen builders + anchors + dict keys.
4. Wire runner switch.
5. Vitest: resolver matrix; at least one step-order test per builder (or parameterized suite); RTL smoke that Explain CTA enables on a sample of mocked pathnames.

Optional later: extract `explainScreenTourFactory` — not required if builders stay thin.

## Observability

- Start / complete / skip: entity `admin_screen_tour:<tour-id>` (same pipeline as hub).
- No new event_type enum unless existing action types already cover tour lifecycle (reuse hub pattern).

## Testing

| Layer | Coverage |
|-------|----------|
| `resolveAdminScreenTour` | Every sidebar path matches; nested paths null; contents vs academic disambiguation; profile path; finance with query |
| Each `explain*Tour` | Step order, selectors, optional flags |
| Explain block / launcher | Enabled when match; disabled on unmatched nested path |
| Anchors | Smoke that key shells expose `data-tour` (spot-check critical screens; not every pixel) |

## Risks and mitigation

| Risk | Mitigation |
|------|------------|
| Huge PR / review fatigue | Ordered file groups by nav group; shared intro/done helpers; parameterized catalog tests |
| Dense screens (analytics, finance) | Group chart clusters; highlight tabs + one default panel, not every widget |
| Conditional empty UI | Optional steps |
| Copy volume (3 locales) | Draft en first in plan, then es/pt in same change; reuse phrasing patterns |
| Profile not under `/admin` | Still register; help FAB must mount on profile when reached from admin chrome (verify launcher host; if FAB absent on profile, either mount help on that layout or document exception — **default: ensure FAB available on profile when admin session**) |

## Definition of done

- [x] Spec approved; implementation plan written.
- [x] Every inventory tour id resolves from its top-level path with correct scope/metaKey.
- [x] Each tour runs content-only with en/es/pt copy and `data-tour` anchors.
- [x] Nested admin routes still show disabled Explain CTA (no crash).
- [x] Hub tour unchanged (still includes chrome).
- [x] Vitest green for catalog + builders + representative UI wiring.
- [ ] Manual QA (user): walk Help → Explain on each sidebar item; confirm no header/sidebar steps; confirm nested pages stay “soon”.

## Out of scope

- Nested route explainers.
- Task tutorials expansion.
- Auto-start / progress persistence.

## Open questions (defaults if you approve without comment)

1. **Profile FAB:** If Help FAB is missing on `/dashboard/profile`, **mount the same admin help launcher** for admin sessions on that page → **default: yes**.
2. **Finance default panel step:** Highlight **Collections** matrix as the main workspace step (not every tab panel) → **default: yes**; tabs get one overview step.
3. **Analytics density:** One intro + title + 2–3 grouped chart regions (not one step per chart) → **default: yes**.

## Approval

Reply **go ahead** / **ok** / **yes** (or request edits) on this file. After approval, Gate 0 marker → plan → TDD implementation.
