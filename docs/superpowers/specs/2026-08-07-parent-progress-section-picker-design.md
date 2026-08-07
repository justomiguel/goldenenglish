# Parent/student Progress: section picker instead of tabs — design

Date: 2026-08-07
Status: approved (user: "no me gusta que en progreso todo se vea apretado… quizás un selector de combo
puede andar mejor, y que solo aparezcan opciones donde efectivamente hay data y que se note que no se
haya leído aún esa data")

## Understanding

`ParentProgressEntry` (shared by `/dashboard/parent/progress` and `/dashboard/student/progress`) shows
four sections — Tasks, Assessments, Feedback, Badges — behind an `UnderlineTabBar`. Three problems:

1. **Cramped.** Four tabs, each with icon + label + optional badge, share one row. On narrow surfaces
   the labels truncate and the row becomes a horizontal scroller; the page also stacks title + lead +
   ward picker + tab row before any content appears.
2. **Empty tabs are indistinguishable from full ones.** A family with no badges still sees a Badges
   tab; clicking it costs a tap and returns an empty state. Worse, `badgeRows` always has rows because
   it includes *locked* catalog badges, so "has content" for badges means *earned* badges only.
3. **No unread signal.** Feedback has a server-side `newCount` (14-day window), but nothing tells a
   parent "there is something here you have not looked at" for the other sections.

## Assumptions

- The four datasets already arrive fully loaded from the RSC page; no new queries.
- "Unread" is per-device knowledge, not an account-level fact. There is no `*_reads` table and adding
  one (plus RLS, migration, write path on every view) is disproportionate here. `localStorage` keyed by
  student is enough, degrades to "everything unread" when unavailable, and works offline in the PWA.
- `?tab=` must keep working: `/dashboard/parent/feedback` redirects to `/progress?tab=feedback`, and
  the home Progress pillar deep-links to `?tab=feedback`.
- Tour anchors on this screen are `parent-progress-title` and `parent-progress-body`; neither lives on
  the tab bar, so replacing it does not break parent tutorials.

## Plan

### Domain (pure, `src/lib/parent/`)

1. `buildProgressSections.ts` — maps the four datasets to `ProgressSection[]`:
   `{ id, count, itemKeys }`. A section is **only included when it has content**:
   - tasks: one entry per row, key `taskInstanceId:status` (a status change counts as news);
   - assessments: key `id:latestAttemptStatus`;
   - feedback: key = item id;
   - badges: **earned only** (`!locked`), key = row id.
2. `progressSeenStorage.ts` — serialize/parse the seen map, compute unread keys, cap stored keys per
   section (200) so the entry cannot grow unbounded. Storage key `ge:progress-seen:v1:<studentId>`.
   Malformed or foreign JSON parses to an empty map instead of throwing.

### Hook

3. `src/hooks/useProgressSectionsUnread.ts` — reads the seen map after mount (hydration-safe: server
   and first client render report zero unread), exposes `unreadBySection` and `markRead(sectionId)`,
   and persists on view. A section never seen before counts every key as unread, which is the honest
   reading of "no leído aún"; opening it clears the pill.

### UI (two trees, Tier A per `05-pwa-mobile-native.mdc`)

4. `src/components/desktop/molecules/ProgressSectionDropdown.tsx` — pointer-first anchored listbox:
   trigger button showing current section + count + unread pill; panel lists available sections with
   icon, label, count and unread pill. WAI-ARIA listbox keyboard support (Up/Down/Home/End/Enter/Esc),
   click-outside and Escape close, focus returns to the trigger.
5. `src/components/pwa/molecules/ProgressSectionSheet.tsx` — touch-first bottom sheet: full-width
   trigger, sheet with ≥44px rows, safe-area padding, backdrop tap to dismiss.
6. `src/components/parent/ProgressSectionPicker.tsx` — `SurfaceMountGate` switch between the two.

A custom listbox rather than a library: the repo ships no headless-UI dependency (its one existing
combobox, `RecipientAutocompleteDropdown`, is also bespoke), the control is a brand primitive built on
design tokens, and adding a dependency for one select would duplicate a category for no gain
(`07-third-party-ui-components.mdc`, "brand or layout primitives").

### Wiring

7. `ParentProgressEntry` renders the picker instead of `UnderlineTabBar`, renders **only the active
   panel** (`role="region"`, labelled by the section name) instead of four `hidden` tabpanels, resolves
   `?tab=` against the available sections and falls back to the first available one, and marks the
   active section read. When no section has content, it shows a single empty state and no picker.
8. Header decompression: the lead paragraph is desktop-only, and the ward picker plus the section
   picker share one toolbar row on wide viewports.

### Copy

9. `dashboard.parent.progressPicker.*` in en/es/pt: picker label, trigger hint, `{count} sin leer`
   (one/many), item counts (one/many), sheet title, close, and the all-empty state.

### Tests

10. Unit: `buildProgressSections` (hides empty, badges count earned only, keys include status),
    `progressSeenStorage` (malformed JSON, unread computation, cap), `useProgressSectionsUnread`
    (first visit is unread, marking read persists, storage failure is non-fatal).
11. RTL: dropdown (only sections with data, keyboard nav, unread pill, selection), sheet (opens,
    selects, dismisses), and `ParentProgressEntry` (`?tab=` fallback, single panel, all-empty state).

## Risks and mitigations

- **First visit shows unread pills everywhere.** Intended, and self-clearing: the section the user
  lands on is marked read immediately, so at most the other sections carry a pill.
- **`localStorage` unavailable (private mode, quota).** Every access is wrapped; on failure the hook
  reports zero unread and the UI behaves as it does today.
- **Hydration mismatch.** Unread state is read in an effect, so server and first client render agree.
- **Losing tab semantics.** Panels become labelled regions; the picker keeps an accessible name and
  the same `?tab=` contract, so deep links and tutorials are unaffected.

## Out of scope

- Account-level read state synced across devices.
- Changing what each section renders internally.
- The `UnderlineTabBar` used by other screens (unchanged; only this screen stops using it).

## Definition of done

- Progress shows one picker; only sections with real content are offered; unread counts show and clear.
- Desktop and PWA trees both implemented and selected via `SurfaceMountGate`.
- `?tab=feedback` deep link still lands on Feedback when it has content, and degrades gracefully.
- en/es/pt copy complete; `tsc`, ESLint, full vitest suite, `next build` and the coverage gate green.
