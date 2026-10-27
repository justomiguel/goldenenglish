# Persistent page tabs and section vs teacher icons

**Intent:** Every page-level tab set remembers the last tab. The student academic list shows an icon for the section name and an icon for the teacher name.

**Done when:**

- A Cursor rule says page-level tabs persist. The URL `tab` query wins. If the URL has no `tab`, the last tab for that path is restored.
- The admin user profile tabs follow that rule. Open Academic, leave the page, come back to the same user: Academic is still selected. A link with `?tab=security` still opens Security.
- Other page-level tabs that keep the choice only in `useState` use the same helper.
- On the student academic section list, the section name has a section icon and the teacher name has a teacher icon. Copy comes from `en.json` and `es.json`.

**Out of scope:**

- Tabs inside a modal (locale tabs in the default-reply editor).
- Wizard steps.
- Replacing the academic section shell `pushState` hack. That shell already writes `?tab=`.
- Showing the teacher on cohort section cards. Those cards do not show a teacher today.

## Context

Finance, events, and the academic section shell already put the tab in `?tab=`. The user profile (`AdminUserProfileFicha`) stores the tab in `useState` and starts on Summary. A remount drops the choice. The user asked for one rule for every page with tabs, because Users does not do it.

On the student academic list (`AdminStudentSectionsList`), the section name and the teacher name sit on one line. Both look like plain links. Staff cannot tell which name is the section.

## Decision

1. Add `.cursor/rules/42-persistent-page-tabs.mdc` (`alwaysApply: true`).
2. Add a small client hook `usePersistentPageTab` under `src/hooks/`.
3. Wire that hook into page-level tab state that is only `useState` today.
4. Add Lucide icons on the section row in `AdminStudentSectionsList`.

### Persistence

- Allowed values are a fixed list. An unknown value falls back to the default.
- If the URL has a valid `tab`, use it. Deep links and tutorials stay correct.
- If the URL has no `tab`, read `sessionStorage` for that pathname (query stripped).
- On change, write `sessionStorage` and set `tab` with `router.replace`. Keep the other query keys.
- Do not use `router.replace` on the academic section shell. That path already updates the URL.

### Icons

- Section name: `BookOpen`, `aria-hidden`, with a dictionary name for screen readers on the row.
- Teacher name: `GraduationCap`, same pattern.
- Assistants stay on the next line. Add a `Users` icon there so that line is not a bare name list.

## Options considered

- **URL only.** A later visit from the user list has no `?tab=`, so the tab resets. Rejected.
- **sessionStorage only.** A shared `?tab=` link would lose to the last local tab. Rejected.
- **Text labels (“Section” / “Teacher”) instead of icons.** The user asked for icons so the two names stay short and still differ.

## Pages to wire

| Surface | File | Notes |
|---|---|---|
| User profile | `AdminUserProfileFicha.tsx` | Reported gap. Tutorial event that forces Security still wins for that click, then the URL stores it. |
| Academic hub cohorts | `AcademicHubCohortBoard.tsx` | |
| Cohort detail | `AcademicCohortDetailShell.tsx` | Tutorial event that opens Sections still runs, then the URL stores it. |
| Messages | `AdminMessagesTabs.tsx` | |
| Section collections | `SectionCollectionsClient.tsx` | |
| Finance insights sub-tabs | `FinanceInsightsClient.tsx` | Nested under a hub that already has `tab`. Use a second query key `insights` so the two do not clash. |
| Badges category | `AdminBadgesListScreen.tsx` | |
| Student billing | `AdminStudentBillingTabsPanel.tsx` | Nested under the user profile. Use query key `billing` so it does not clash with the profile `tab`. |
| Section roster | `AcademicSectionRosterTable.tsx` | |
| Teacher roster | `TeacherSectionRoster.tsx` | |

Link tabs that already set `?tab=` (finance hub, event detail) stay as they are. The rule cites them as the pattern.

## Tests

- Pure parse: valid id, unknown id, empty.
- Hook: URL wins over storage; storage fills a missing URL; change writes both.
- User profile: selecting Academic puts `tab=academic` on the URL.
- Section list: section icon and teacher icon are present with accessible names from the dictionary.

## Manual QA (user)

- Open a student, choose Academic, open a section, go back. Academic is still selected.
- Open the same student from the user list with no query. Academic is still selected.
- Open `?tab=security`. Security opens.
- On Academic, the section name and the teacher name each have an icon.
