# Home screens that lead with what people came for

**Date:** 2026-08-06
**Status:** Approved
**Program:** [`2026-08-06-usability-audit-program.md`](2026-08-06-usability-audit-program.md) — spec 7 of 8
**Closes:** F11, F12, F15, F18. **Narrows F13**
**Related:** `ParentHomeInbox`, `ParentHomePwaFocus`, `ParentHomeStatusGrid`,
`buildParentHomePillarSnapshot`, `AdminHubHome`, `src/dictionaries/{en,es,pt}.json`

## Intent

A parent opens the portal to find out how their child is doing. The home screen shows
attendance, messages and fees — and not a single grade, even though the grade has already
been fetched from the database and is sitting unused in memory. An administrator opens
their home and the first card is upcoming birthdays, above the money.

## Context

Every claim in this spec was checked against the code, because two findings elsewhere in
this audit turned out to be misdiagnosed. These five held up.

### F11 — the grade is already there

`src/app/[locale]/dashboard/parent/page.tsx:37` calls `loadParentChildrenSummaries`, whose
`ParentChildSummary` includes `lastPublishedGrade`. The value reaches `ParentHomeInbox` and
`ParentHomePwaFocus` inside `summaries` — and both pass it no further than
`ParentChildSwitcher`, which uses only the name.

`buildParentHomePillarSnapshot` produces exactly three pillars — attendance, messages,
payments — and `ParentHomeStatusGrid` renders those three and nothing else.

So the most-wanted number on the page is fetched on every render and thrown away.
**Showing it costs no additional query.** There is even a component that renders it,
`ParentChildLastGradeLine`, reached through `ParentDashboardFamilyView` — which is not
imported by the live entry point and appears to be orphaned, exercised only by its own
test.

### F12 — two different pages at one address

The choice is not a CSS breakpoint. `computeAppSurface` in `useAppSurfaceCore.ts:15` reads
`matchMedia`, and `SurfaceMountGate.tsx:47` mounts **one tree or the other**:

| Block | Desktop | Mobile / PWA |
|-------|---------|--------------|
| Kicker and full date | yes | no |
| Child context line | no | yes |
| Push-permission banner | no | yes |
| Status pillars | yes | yes, plus per-child rows |
| **News feed** | **no** | **yes** |

`loadParentHomeNewsFeed` runs on the server for both, and `ParentHomeInbox` does not even
accept a `newsItems` prop. A desktop user is served a query's worth of news that is then
discarded. The difference is informational, not cosmetic.

### F13 — mostly by design, with one genuine gap

`/parent/tasks`, `/parent/assessments` and `/parent/badges` are redirects into
`/parent/progress?tab=…`, and `/parent/billing` redirects into `/parent/payments?tab=fees`.
None appears in any navigation.

That is defensible: tasks, assessments and badges *are* facets of progress, and a family
menu of six items should not become ten. Sub-tabs under a well-named parent destination is
reasonable structure, and each already has a shareable URL.

The real gap is the fourth tab inside `/progress`: **`feedback` has no alias at all.** Its
three siblings can be linked to and it cannot. That asymmetry is a defect; the grouping is
not.

### F15 — birthdays outrank money

`AdminHubHome.tsx` renders, in order: title, a conditional students-without-section banner,
`UpcomingBirthdaysCard`, then the metrics grid — in which payments is the third card. A
nicety is given the most valuable position on the page, unconditionally.

### F18 — a wide column holding a narrow stack

`ParentDashboardShellClient.tsx:67` gives the content area `flex-1`, so it grows with the
viewport. Inside it, `ParentHomeStatusGrid` is `sm:grid-cols-1` with no wider breakpoint,
so three cards stay in one column however wide the screen. With no news feed on desktop
there is nothing to occupy the rest.

This is the one finding that cannot be measured from source. The structure explains the
symptom, and the fix follows from the structure rather than from a pixel count.

## Decisions

| Topic | Choice |
|-------|--------|
| Grades on the family home | A fourth pillar, "Progreso", from data already loaded |
| Desktop and mobile | Same information on both. Presentation may still differ |
| News feed | Rendered on desktop, where it is already fetched |
| Push banner | Stays mobile-only. It prompts for a permission tied to installing the app |
| Hidden sub-tabs | Menu unchanged. `feedback` gains the alias its three siblings have |
| Admin home order | Money first, birthdays after the metrics |
| Desktop density | The pillar grid gains wider breakpoints; no new blocks invented |

### What "same information" does and does not mean

It means neither surface hides a block of content the other shows. It does not mean the two
must look alike: the mobile screen may keep its per-child rows and its compact ordering, and
the desktop may keep its date line. The rule is about what a user can learn, not about
pixels.

### Why a fourth pillar rather than a redesign

The status grid already has the right shape: a card per area of concern, each linking to
the page that owns it. Progress is missing from that list, not from the layout. Adding a
fourth card reuses `ParentHomeStatusCard`, inherits its styling and accessibility, and
keeps the change reviewable. Redesigning the home is a bigger question than this audit
asked.

## Architecture

- `buildParentHomePillarSnapshot` gains a `progress` pillar carrying the last published
  grade and a level, derived from the `summaries` already passed in. Pure function, so this
  is the easiest part to test and the place the logic belongs.
- `ParentHomeStatusGrid` renders the fourth card, linking to `${base}/progress`, and gains
  wider breakpoints — one column on a phone, two from `md`, three from `xl` — instead of
  today's unconditional single column.
- `ParentHomeInbox` accepts `newsItems` and renders `ParentHomeNewsFeed`, and shows the
  child context line the mobile screen already has. `ParentDashboardEntry` passes the prop
  it is already receiving.
- `AdminHubHome` moves `UpcomingBirthdaysCard` below the metrics grid. Only order changes;
  the card and its `data-tour="admin-hub-birthdays"` anchor must survive, and any tour step
  whose wording depends on the old position is updated.
- New `src/app/[locale]/dashboard/parent/feedback/page.tsx`, a redirect to
  `/parent/progress?tab=feedback`, mirroring the three existing aliases exactly — including
  forwarding `studentId`, which spec 2 made the canonical parameter.
- Copy for the new pillar in all three dictionaries.

`ParentDashboardFamilyView` is left alone. If it really is orphaned it should be deleted,
but proving that and removing it is not this spec's job.

## Testing

TDD. Self-contained per `.cursor/rules/30-harness-self-contained-tests.mdc`.

1. **The progress pillar** — `buildParentHomePillarSnapshot` returns a progress pillar
   carrying the child's last published grade; a child with no published grade yields a
   neutral level rather than an alarming one; the existing three pillars are unchanged. The
   existing tests for this function must still pass untouched.
2. **The grade reaches the screen** — the home renders the last grade for the selected
   child, and the card links to `/progress`. This is F11 stated as a test.
3. **Surface parity** — a test that renders both `ParentHomeInbox` and `ParentHomePwaFocus`
   with identical props and asserts that the news feed appears in both. This is the test
   that keeps F12 closed.
4. **No new queries** — the parent page's loader set is unchanged. Assert against the list
   of loaders the page calls, so a future "just one more fetch" on the home is caught.
5. **Admin order** — in `AdminHubHome`'s output, the payments metric appears before the
   birthdays card in document order, and the birthdays tour anchor is still present.
6. **The feedback alias** — `/parent/feedback` redirects to `/progress?tab=feedback` and
   forwards `studentId` when given one, matching the tasks alias.
7. **Locale parity** — the three dictionaries stay structurally identical.

## Done when

1. A parent sees their child's latest grade without leaving the home.
2. No extra database work is done to show it.
3. Desktop and mobile show the same blocks of information.
4. The desktop home uses its width.
5. The admin home leads with money.
6. All four progress tabs have a URL.
7. The family menu has not grown.
8. Every `data-tour` anchor still exists and no tour step describes an old position.

## Out of scope

- Redesigning either home. The blocks and their styling stay; what changes is which of
  them appear and in what order.
- Adding tasks, assessments and badges to the family menu. See F13 above.
- Deleting `ParentDashboardFamilyView`.
- Whether the push-permission banner should also appear on desktop.
- The teacher and student home screens, which the audit did not measure.

## Manual QA

Owned by the user per `.cursor/rules/32-manual-qa-user-owned.mdc`.

1. As a parent with a child who has a published grade, open the home on a laptop: the grade
   is visible and its card opens Progreso.
2. As a parent whose child has no grade yet, confirm the card reads as neutral and not as a
   problem.
3. Compare the home at 1440 px and at 390 px: the same blocks appear, including the news.
4. At 1440 px the page should no longer be a single narrow column.
5. As an admin, confirm pending payments is visible before birthdays, and run the admin
   tour to confirm the birthdays step still lands.
6. Open `/dashboard/parent/feedback` directly; it should land on Progreso with the feedback
   tab open.
