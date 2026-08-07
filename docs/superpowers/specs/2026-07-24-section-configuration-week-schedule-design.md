# Section Configuration — unified settings + weekly schedule grid

**Date:** 2026-07-24  
**Status:** Approved  
**Related:** `AcademicSectionConfigurationPanel`, `AcademicSectionScheduleEditor`, `SectionScheduleFields`, `updateAcademicSectionScheduleAction`

## Intent

Replace the stacked “card farm” on admin **section → Configuration** with a clearer layout: one **settings summary** surface on top and a **Monday–Sunday week timetable** below for schedule editing (drag/resize/create blocks), with an explicit **Save schedule** — without changing the persisted `SectionScheduleSlot` contract.

## Understanding

- Today `AcademicSectionConfigurationPanel` stacks six bordered editors (feature flags, period, capacity, min attendance, room, schedule). The schedule is a list of day/start/end forms (`SectionScheduleFields`), which feels unintuitive for weekly class times.
- Slots remain `{ dayOfWeek: 0–6, startTime, endTime }` (`0` = Sunday in data). Overlap/normalize logic already lives in `sectionScheduleSlots` / drafts helpers.
- Repo already has `@dnd-kit` and FullCalendar; for a **weekly template** (not dated events), a custom grid maps 1:1 to slots better than FullCalendar’s fake week.
- Tier B admin surface: desktop-first; still need keyboard/accessible alternatives to pure pointer DnD (`05`, `26`).

## Decisions (approved in brainstorming)

| Topic | Choice |
|-------|--------|
| Scope | Entire Configuration tab (settings layout + schedule), not schedule-only |
| Page structure | **Summary on top** (single surface, three groups) + **full-width week grid below** |
| Schedule save | Local draft edits; explicit **Guardar horario** (no auto-save on drop) |
| Week columns | **Mon → Sun** (UI order); data still `dayOfWeek` 0–6 |
| Grid tech | Custom week grid (not FullCalendar) |
| Create block | Click empty cell → new block |
| Default duration | Mode of existing block durations; if none → **60 minutes** |
| Move / resize | Drag block to change day/time; drag bottom edge to resize |
| Snap | **15 minutes** |
| Overlap | Reject same-day overlapping slots with dictionary error (client + existing server validate) |
| Settings groups | **Clase** (period + room), **Cupo y asistencia** (capacity + min attendance), **Funciones** (feature flags) — each keeps its current save action |
| New-section modal | **Out of scope** — keep `SectionScheduleFields` there for now |

## Proposed UX

### Zone A — Section settings summary

1. One outer surface titled from dictionaries (e.g. section settings).
2. Responsive 3-column grid (stack on narrow) with soft inner panels (not six separate bordered cards):
   - **Clase:** period (starts/ends) + room label. Keep **separate** save buttons / actions as today (period action vs room action); only the chrome is unified.
   - **Cupo y asistencia:** max students + min attendance %. Keep separate saves per existing actions.
   - **Funciones:** evaluations / learning-route checkboxes + existing feature-flags save.
3. No server-action contract changes — presentation regrouping only; polish dictionary hints that still imply a stacked form below.

### Zone B — Weekly schedule

1. Title + hint + dirty badge (“unsaved changes”) + primary **Save schedule** (Lucide `Save`, `16`).
2. Grid: **left time gutter** with hour labels (`HH:00`) + columns Lun…Dom; **dotted horizontal hour lines** across the day columns (calendar-style, Fantastical-like). Visible hour window can default from existing slots (± padding) or a sensible admin default (e.g. 07:00–22:00) with scroll if needed.
3. Blocks render as positioned chips showing start–end.
4. **Selected block** inspector under/beside grid: day, start, end (editable), delete — required for a11y and precise edits.
5. Interactions:
   - Click empty → insert draft at snapped time with default duration.
   - Drag → move day/start (preserve duration), snap 15′.
   - Resize bottom edge → change end, snap 15′, min duration ≥ 15′.
   - Overlap → block drop/create and show error from dict.
6. Save → `sectionScheduleDraftsToSlots` / normalize → `updateAcademicSectionScheduleAction` → `router.refresh()` on success (`27`).
7. Grid a11y: `role="region"` + `aria-label={dict.gridAria}` (Task 4 — full `role="grid"` semantics deferred; inspector is the precision path).

## Architecture

| Piece | Responsibility |
|-------|----------------|
| `AcademicSectionConfigurationPanel` | Compose Zone A + Zone B |
| `AcademicSectionSettingsSummary` (new organism/molecule split ≤250 LOC) | Layout for period, room, capacity, min attendance, flags editors without extra outer cards |
| Existing `*Editor` components | Prefer reuse of form bodies; strip redundant outer `<section>` chrome when nested in summary |
| `AcademicSectionWeekScheduleEditor` | Client draft state, grid, inspector, save |
| Pure lib (`sectionScheduleDefaultDuration`, snap, overlap helpers) | Testable rules; no React/Supabase |
| Keep `SectionScheduleFields` | Create-section modal + fallback |

Dependency direction: pure lib ← editor hook/organism ← panel. No new persistence columns.

## i18n / tours / analytics

- All new chrome (dirty badge, inspector labels, overlap/create errors, aria) in `en` / `es` / `pt` (`09`).
- If Configuration / schedule tour anchors exist, update L1/L2 in the same change (`33`).
- No new `user_events` type required for layout-only; optional `recordSystemAudit` already on schedule update if present — do not regress.

## Testing

| Layer | Cases |
|-------|--------|
| Pure unit | Default duration (empty → 60; mode of set); snap to 15′; same-day overlap true/false |
| RTL | Summary groups render; click cell adds block; dirty badge; save calls action with expected slots; overlap shows alert; selected block delete |
| REGRESSION CHECK | Schedule action payload shape unchanged; create-section modal still uses list fields |

## Risks & mitigation

| Risk | Mitigation |
|------|------------|
| DnD a11y | Inspector + keyboard-friendly controls always available |
| File size | Split grid / block / inspector / hook |
| Hour window UX | Derive from slots; clamp extremes; document default window |
| Tour drift | Update anchors + `listTourRuntimeChecks` if Configuration is toured |
| Locale week start | UI fixed Lun→Dom per product choice; data `dayOfWeek` unchanged |

## Done when

- [ ] Configuration is no longer a stack of six equal cards; summary + week grid match this layout.
- [ ] Week grid shows Mon–Sun; create / drag / resize / snap 15′ / default duration work in draft; Save persists via existing action.
- [ ] Overlap and invalid ranges show dictionary errors; selected-block inspector supports edit/delete without drag.
- [ ] en / es / pt updated; Vitest pure + RTL coverage; tour L1/L2 updated if anchors touched.
- [ ] Manual QA (user): edit settings groups; build a Mon+Wed schedule by click+drag; save; reload confirms slots.

## Out of scope

- Reworking “new section” modal schedule UI.
- Auto-save on every drag.
- FullCalendar-based editor.
- Schema / RLS / API contract changes.
- Teacher-portal schedule editing.

## Alternatives considered

| Option | Why not |
|--------|---------|
| FullCalendar `timeGridWeek` | Awkward for undated weekly templates; heavier CSS footprint in admin |
| Week view + form-only edit (no DnD) | Rejects explicit drag/resize request |
| Settings in sidebar next to grid | Rejected in favor of summary-above / calendar-below |

## Open follow-ups (non-blocking)

- Phase 2: reuse week grid in new-section modal.
- Optional: collapse summary groups on very short viewports.
