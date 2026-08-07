# The back button works, and the schedule tab says what it holds

**Date:** 2026-08-06
**Status:** Approved
**Program:** [`2026-08-06-usability-audit-program.md`](2026-08-06-usability-audit-program.md) — spec 6 of 8
**Closes:** F08 (reframed), F10 (reframed). **Reopens F09 as not-a-defect**
**Related:** `src/components/organisms/AcademicSectionShellWorkspace.tsx`,
`src/components/dashboard/studentSidebarNavGroups.tsx`, `src/dictionaries/{en,es,pt}.json`

## Intent

Three audit findings claimed this area of the app was badly structured. Investigating the
code found that two of the three were wrong and the third was right for the wrong reason.
This spec fixes what is actually broken and records what is not, so nobody rebuilds
something that already works.

## Context

### F08 said the section areas have no URL. They do.

The audit reported that opening an area of an academic section leaves the address bar
unchanged. `AcademicSectionShellWorkspace.tsx:87` shows otherwise:

```ts
const navigate = (next: AcademicSectionShellAreaId | null) => {
  setArea(next);
  const url = next ? `${pathname}?tab=${encodeURIComponent(next)}` : pathname;
  router.replace(url);
};
```

Areas are addressable as `?tab=fees`, the server reads the parameter on a cold load, and
`AcademicSectionAssessmentsPanel.tsx:50` already deep-links back into `?tab=evaluations`
after editing a rubric.

**What is genuinely broken is `replace`.** It overwrites the history entry instead of
adding one, so an admin who goes hub → fees → students and presses back is thrown out of
the section page entirely rather than stepping back through the areas. The symptom the
audit felt was real; the cause it named was not.

### F09 said the schedule lives in a modal. It does not.

`AcademicSectionWeekScheduleEditor` is rendered inline by
`AcademicSectionConfigurationPanel.tsx:127`, inside the section's configuration area. There
is no modal anywhere in that chain, and it is the only place the editor is mounted.

The one schedule-in-a-modal in the product is the **family** read-only agenda, opened from
the attendance screen — a different component, a different audience, and a reasonable use
of a modal for a secondary view. **F09 is closed as not reproducible.** Promoting the
editor to its own route was estimated at five to eight files and a day or two; spending
that on a premise that turned out to be false would be waste.

### F10 said "Asistencias" points somewhere wrong. It points somewhere right.

`/dashboard/parent/calendar` renders `ParentAttendancePwaScreen`, whose primary content is
attendance: one card per section per child with mark-by-mark presences and absences and a
monthly percentage. The agenda is secondary, behind a button. So the family label
"Asistencias" describes the page accurately, and its heading and breadcrumb agree with it.

The misnamed thing is the **route segment** `/calendar` and the dictionary key `calendar` —
internal names, invisible to users, not worth a redirect and a migration of every link.

But the investigation did find a real instance of the defect F10 describes, in a portal the
audit did not check. The student portal renders **the very same component** — same
attendance cards, same secondary agenda — under the label **"Mi agenda"**. Students are
told they are opening a diary and are shown their attendance record. That is the actual
label-does-not-match-page bug, and it is the one this spec fixes.

## Decisions

| Topic | Choice |
|-------|--------|
| Area history | A history entry per area, without a server round trip |
| How | `window.history.pushState`, with the component reading `useSearchParams` |
| Route segment `/calendar` | Left alone. Internal name, high churn, no user benefit |
| Family label "Asistencias" | Unchanged. It is correct |
| Student label "Mi agenda" | Becomes "Asistencias", matching the page and the family portal |
| F09 | Closed as not-a-defect, with evidence, in the program document |

### Why not simply `router.push`

Swapping `replace` for `push` is a one-line change and it does fix the back button, but
`push` re-runs the section page on the server, and that page performs roughly six parallel
loads — section data, learning-route options and workspace, billing currency, the
attendance matrix, the health snapshot and assessments. Every area click would pay for all
of it, and so would every press of back. Trading a navigation bug for a latency bug is not
an improvement.

Next's App Router supports `window.history.pushState` for URL changes that do not re-run
the server, with `useSearchParams` re-rendering in response. The area panels are all
pre-rendered from props the server already sent, so nothing needs refetching when the area
changes — which is exactly the situation that technique exists for.

### Making the URL authoritative

Today the area lives in `useState`, seeded from a server prop, with the URL written as a
side effect. Two sources of truth, and the browser can change one of them behind the
component's back — which is why back and forward do nothing.

The component instead derives the area from `useSearchParams().get("tab")`, validated
through the existing `resolveAcademicSectionShellArea`. `navigate` becomes a `pushState`
call and nothing else. Back and forward then work because the browser updating the URL is
the same event as the component changing area.

`useSearchParams` in a client component needs a Suspense boundary when the route can be
statically rendered. This route is dynamic — it is behind admin auth, which reads cookies —
but the production build is the authority, and if it asks for a boundary, one is added at
the mount site in `AcademicSectionPageShellBody`.

## Architecture

- `AcademicSectionShellWorkspace.tsx` — `useState` for the area is removed in favour of
  `useSearchParams`; `navigate` uses `pushState`. The `initialArea` prop stays, since the
  server still resolves it for the first paint.
- `AcademicSectionPageShellBody.tsx` — a Suspense boundary only if the build requires one.
  The `key` prop on line 114, which forces a remount when feature flags change, must be
  re-checked: remounting no longer resets the area, because the area no longer lives in the
  component.
- `studentSidebarNavGroups.tsx` — no code change; the label comes from
  `dashboard.studentNav.calendar`, whose Spanish value changes from "Mi agenda" to
  "Asistencias", in all three locales. The student breadcrumb and heading keys are checked
  for the same wording so the whole portal agrees.

Nothing else moves. No route is added, renamed or redirected.

## Testing

TDD. Self-contained per `.cursor/rules/30-harness-self-contained-tests.mdc`.

1. **Opening an area pushes history** — clicking a hub card calls `pushState`, not
   `replace`, and the pushed URL carries the right `tab`. This fails today.
2. **The URL drives the view** — with `useSearchParams` returning `tab=fees`, the fees area
   renders without any click; changing it to `tab=students` renders students. This is what
   makes back and forward work, so it is the test that matters most.
3. **An unknown or absent `tab`** falls back to the hub, through the existing resolver.
4. **No server refetch** — `router.push` and `router.replace` are not called when switching
   areas. This pins the performance decision so a later refactor cannot quietly undo it.
5. **Student label** — `dashboard.studentNav.calendar` reads "Asistencias" in Spanish, is
   translated in English and Portuguese, and matches the student breadcrumb and page
   heading. The family label is asserted unchanged.

Existing coverage is thin here: the one workspace test asserts an icon's CSS class and
never exercises `navigate`. These tests are the first real coverage of area switching.

## Done when

1. Back and forward step through the areas an admin has opened.
2. Switching area does not re-run the page on the server.
3. A pasted `?tab=` link opens that area, as it does today.
4. Students see their attendance screen labelled as attendance.
5. The family portal is unchanged.
6. No route is added, renamed or redirected.

## Out of scope

- Renaming the `/calendar` route segment or the `calendar` dictionary key.
- Giving the schedule editor its own route. See F09 above.
- Restructuring the section hub, which is spec 7's territory.
- The attendance screen's own layout, including whether the agenda deserves to be behind a
  button.

## Manual QA

Owned by the user per `.cursor/rules/32-manual-qa-user-owned.mdc`.

1. Open a section as admin, click into three areas in turn, then press back three times.
   You should walk back through them and only then leave the page.
2. Area switching should feel instant, with no reload flicker.
3. Paste a `?tab=fees` link into a new tab; it opens on fees.
4. Edit a rubric from the evaluations area and use its back link; it should still return
   with evaluations open.
5. Log in as a student: the menu item over the attendance screen reads "Asistencias".
