# Admin help — contextual “Explain this screen”

**Date:** 2026-07-11  
**Status:** Approved  
**Related:** [`2026-07-11-admin-help-tutorials-design.md`](./2026-07-11-admin-help-tutorials-design.md), ADR `docs/adr/2026-07-admin-help-driverjs-tutorials.md`

## Intent

The tutorials FAB must always feel **context-aware**: on every admin route, staff can start a guided Driver.js tour that **explains the current screen**.

**v1 ships one screen tour:** admin hub home (`/{locale}/dashboard/admin`). That tour is the **only** one that also explains **chrome** (top header buttons) and **sidebar nav**. Future screen tours explain **page content only**.

Task tutorials already in the catalog (`create-cohort`, `create-section`) stay available; they are **how-to** flows, not screen explainers.

## Understanding

- Help FAB already opens a panel with task tutorials; it is **not** tied to the current pathname.
- Admin home (`AdminHubHome`) shows summary cards (traffic, users, payments, registrations, messages), birthdays, and optional “students without section” banner; chrome lives in `AdminDashboardShell` (header + sidebar).
- Driver.js + `data-tour` anchors + dictionary copy patterns already exist under `src/lib/admin-tutorials/`.

## Goals

1. Always surface a primary action: **“Explícame esta pantalla”** / **“Explain this screen”** (dict), contextual to `pathname`.
2. On admin hub: multi-step tour covering **sidebar groups**, **header actions**, and **main content** regions.
3. Establish a reusable **screen-tour** registry (route match → tour id → step builder) so later routes add content-only explainers without reworking the FAB.
4. When no screen tour exists yet for the route: show a clear empty/disabled state (dict), not a broken Play.

## Non-goals (this change)

- Writing explain tours for every admin route (only hub home in v1).
- Replacing task tutorials or merging Search into the help FAB.
- AI-generated / free-form chat explanations.
- Student / parent / teacher surfaces.
- Persisted “I already saw this” checklist (optional later).

## Product rules (locked)

| Rule | Detail |
|------|--------|
| Primary CTA | Help panel always leads with **Explain this screen** for the matched route. |
| Hub scope | Admin home tour includes **sidebar + top chrome + content**. |
| Other screens (future) | Explain tours are **content-only** (main column); do **not** re-tour nav/header. |
| Engine | Same Driver.js runner / popover tokens as task tours. |
| Copy | `en` / `es` / `pt`; follow `.cursor/rules/31-admin-tutorials-copy.mdc` (teach, not only point). |

## UX

### Help panel layout (order)

1. **Contextual block** (always first)
   - Title: screen name from registry / dict (e.g. “Admin home”).
   - One-line blurb: what this explainer covers.
   - Primary `Button` with Lucide `Map` / `ScanSearch`: **Explain this screen**.
   - If no tour registered for pathname: muted message + disabled CTA (dict).
2. **Divider** + existing **task tutorials** list (`AdminHelpTutorialList`) unchanged below.

Optional later: filter task tutorials by route; **out of scope** for v1.

### Admin home tour steps (proposed order)

1. **Intro** (centered / `anchor: null`) — what the admin hub is for.
2. **Sidebar** — overview of nav groups (Academic, Users, Finance, etc.); highlight sidebar root `data-tour="admin-sidebar"` (or first group). Do **not** click every link; explain purpose of the menu.
3. **Header chrome** — brand / dual-role / profile / mobile menu affordances as present on desktop (`data-tour` on header cluster).
4. **Page title / lead** — hub heading.
5. **Students without section** banner (skip step if element absent — Driver allow optional / runner skips missing optional anchors).
6. **Birthdays** card.
7. **Metric cards** — traffic, users, payments, registrations (group or one step per card; prefer **one step per card** for clarity, still ≤ ~10 steps total).
8. **Messages** card.
9. **Done** — remind FAB stays available on other screens for future explainers + task tutorials.

Exact step count may trim in implementation if copy feels long; keep hierarchy: chrome → content.

### Path matching

Pure helper, e.g. `resolveAdminScreenTour(pathname, locale) → { id, scope } | null`:

- Match admin home when path is exactly `/{locale}/dashboard/admin` (optional trailing slash).
- Nested routes (`…/admin/users`, `…/admin/academic/…`) do **not** match hub tour.
- `scope: "chrome-and-content" | "content-only"` — hub = `chrome-and-content`; all future = `content-only`.

## Architecture

```
src/lib/admin-tutorials/
  screenCatalog.ts          # pure: route patterns → screen tour ids + scope
  explainAdminHomeTour.ts   # pure step defs + selectors
  client/
    startExplainScreenTour.ts
    startAdminTutorial.ts   # unchanged for task ids; or thin dispatch shared

UI:
  AdminHelpLauncher         # resolves screen tour from pathname; passes to panel
  AdminHelpExplainScreenBlock  # contextual CTA (new molecule/organism under dashboard/)
  AdminHelpTutorialList     # unchanged below
```

### Anchors (`data-tour`) — hub

| Anchor | Element |
|--------|---------|
| `admin-sidebar` | Desktop sidebar nav root |
| `admin-chrome-header` | Top header bar (or primary actions cluster) |
| `admin-hub-title` | Hub `h1` / title block |
| `admin-hub-students-without-section` | Banner link (optional) |
| `admin-hub-birthdays` | Birthdays card wrapper |
| `admin-hub-traffic` | Traffic metric card |
| `admin-hub-users` | Users metric card |
| `admin-hub-payments` | Payments metric card |
| `admin-hub-registrations` | Registrations metric card |
| `admin-hub-messages` | Messages card |

Reuse existing nav `data-tour` where useful for a single “sidebar” highlight; avoid forcing every nav item into the hub tour.

### i18n namespaces

```
dashboard.adminHelpLauncher.*          # optional: panel section labels
dashboard.adminHelpExplainScreen.*     # CTA, empty state, section heading
dashboard.adminHelpScreenTours.adminHome.steps.*
dashboard.adminHelpScreenTours.adminHome.meta.*  # title, description for contextual block
```

### Observability

- `trackEvent` / allowed action type with entity `admin_screen_tour:admin-home` on start / complete / skip (same sanitization as task tours).

### Testing

| Layer | Coverage |
|-------|----------|
| `resolveAdminScreenTour` | home match / nested no-match / locale prefix |
| `explainAdminHomeTour` steps | order, selectors, optional anchors |
| `AdminHelpExplainScreenBlock` | CTA enabled when tour exists; disabled + empty copy when not |
| Launcher | opening on mocked home pathname shows explain CTA; Play starts runner (mocked) |
| Anchors | smoke that hub + shell expose `data-tour` |

## Risks and mitigation

| Risk | Mitigation |
|------|------------|
| Tour too long on hub | Cap steps; group chrome into 2 steps max |
| Optional banner missing | Mark step optional; skip if selector absent |
| Confusion with task tutorials | Visual hierarchy: explain block first; different CTA label/icon |
| Future routes forget content-only rule | `scope` on catalog + rule note in `31-admin-tutorials-copy.mdc` |

## Definition of done

- [ ] Spec approved; plan written if multi-file (expected).
- [ ] Help panel always shows contextual **Explain this screen** block driven by pathname.
- [ ] Admin hub tour runs (chrome + content) with dictionary copy (en/es/pt) and `data-tour` anchors.
- [ ] Non-hub admin routes: CTA present but disabled/empty until a tour is registered (no crash).
- [ ] Task tutorials still listed and startable.
- [ ] Vitest for resolver, step builder, explain block, launcher wiring.
- [ ] Short note in ADR or follow-up ADR bullet if public help contract expands (screen tours).
- [ ] Manual QA (user): open FAB on `/dashboard/admin`, run explainer; open FAB on another admin page, confirm empty/disabled explain state.

## Out of scope

- Explain tours for academic, users, finance, etc. (follow-up specs per screen or a batch).
- Auto-start tour on first visit.
- Changing Search FAB / ⌘K behavior.

## Open questions (defaults if you approve without comment)

1. **CTA when no tour:** disabled button + “Soon for this screen” vs hide button and show only text → **default: disabled + short message**.
2. **Metric cards:** one step each vs one “metrics grid” step → **default: one step per card** (clearer teaching).
3. **Sidebar:** single overview step vs one step per nav group → **default: single overview** (hub already dense).

## Amendment (2026-07-11b) — top chrome action steps

Admin home explain tour must highlight **individual** header actions after the header overview:

1. Back to public site  
2. Teacher dashboard (optional — skip if not rendered)  
3. Sign out  
4. Language switcher  

Each gets its own `data-tour` anchor and dictionary step.
