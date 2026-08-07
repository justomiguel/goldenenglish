# Configuration area — Fees-style icon chrome + enabled block colors

**Status:** Approved  
**Related:** `2026-07-23-section-area-visual-scheme-design.md`, `2026-07-24-section-week-schedule-visual-polish-design.md`

## Intent

Align **Configuration** with the shared section-area visual scheme (large Lucide icon wells + block headers) and stop **saved** schedule blocks looking disabled (muted gray).

## Understanding

- Other drill-downs (Fees, Teachers, …) use `AcademicSectionAreaBlock` / `AcademicSectionAreaBlockHeader` (h-12 primary-tint icon well + H2 + lead).
- Configuration still uses plain `h2` text headers on Settings + Schedule cards — no icon wells.
- Saved calendar chips use `bg-muted` gray, which reads as inactive/disabled next to primary unsaved/dragging states.

## Decisions

1. **Settings summary** — wrap (or restyle header) with `AcademicSectionAreaBlock` + icon `Settings2` (same as hub configuration). Drop redundant outer border nesting if the AreaBlock already provides card chrome; keep the 3 soft inner groups.
2. **Weekly schedule** — same: `AcademicSectionAreaBlock` + icon `CalendarClock` (or `CalendarDays`); move title/hint into block header; keep dirty badge + Save in a toolbar row under the header (icons on buttons already OK).
3. **Saved blocks** — primary soft fill + solid primary border (enabled calendar event look), e.g. `bg-primary/20` + `border-primary/50` + foreground text. **Unsaved** stays dashed / stronger primary tint. **Dragging** stays solid primary + primary-foreground.
4. No new dictionary keys unless a11y needs them; reuse `settingsSummary.title/lead` and `scheduleEditor.scheduleTitle/scheduleHint`.

## Done when

- [x] Configuration shows two AreaBlocks with large icon wells matching Fees/Teachers.
- [x] Saved schedule blocks no longer look gray/disabled.
- [x] Existing schedule/config Vitest still green; smoke asserts icon wells or block heading structure if practical.
- [x] ≤250 LOC per file.

## Out of scope

- Changing save/overlap/drag behavior.
- Redesigning the three settings groups into separate AreaBlocks (optional later).

## Manual QA (user)

1. Open Configuration — compare icon chrome to Fees.  
2. Saved slot looks “active” (brand tint), not gray.  
3. Unsaved + drag colors still distinct.
