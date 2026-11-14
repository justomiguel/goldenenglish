# Academic hub — two cohort tabs

**Intent:** On Cohorts & sections, show only Active and Archived. On Active, put the current cohort first, marked and highlighted. List the other active cohorts under it.

**Done when:**

- The board renders two tabs: Active and Archived. Active is the default and starts selected.
- The Current tab is gone.
- On Active, the current cohort is the first block. It shows the current badge and a highlighted surface.
- The other active cohorts sit in the list under that block.
- Archived still lists only archived cohorts.
- A URL or stored value of `tab=current` opens Active.
- Copy in `en.json`, `es.json`, and `pt.json` matches the two tabs. Spanish stays neutral tuteo.
- The academic hub screen tour no longer names three tabs.
- Tests cover the highlighted current row, the list under it, and the archived tab.

**Out of scope:** Cohort detail tabs (overview, sections, retention, transfers). Create, archive, and set-as-current actions stay as they are. No new data model.

## Surfaces (Web vs PWA)

Tier B — desktop-only (no PWA tree). The hub lives at `src/app/[locale]/dashboard/admin/academic/page.tsx`. No `src/components/pwa/` caller reads this board. Shared row and toggle stay compatible with the desktop hub.

## Current behavior

`AcademicHubCohortBoard` uses three tabs: `current`, `active`, `archived`. The page already splits rows: one current cohort, other active cohorts, archived cohorts. The current cohort is hidden from the Active list.

## Decision

Keep the page split. Change only the board layout.

1. Tabs are `active` and `archived`. Fallback is `active`.
2. On Active, render `current` first when it exists. Use a highlighted card (primary tint, current badge). Do not repeat that row in the list below.
3. Render `active` under that card in the existing row list.
4. If there is no current cohort, keep the existing banner and show only the active list.
5. Drop the Current tab panel. Leave unused dictionary keys in place so old readers do not break. New visible strings describe the two-tab layout.

## Files

- `src/components/organisms/AcademicHubCohortBoard.tsx`
- `src/__tests__/components/AcademicHubCohortBoard.test.tsx`
- `src/dictionaries/en.json`, `es.json`, `pt.json` (`academicHub.board` and the hub screen-tour `boardTabs` step)
- Tutorial contract tests only if they assert the old three-tab title

## Manual QA (user)

Open `/dashboard/admin/academic`. Confirm Active is selected, the current cohort is highlighted on top, and the other active cohorts are listed under it. Open Archived and confirm only archived rows.
