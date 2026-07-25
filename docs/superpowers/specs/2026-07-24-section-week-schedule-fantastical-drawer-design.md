# Section week schedule — Fantastical layout + inspector drawer (A2)

**Status:** Approved  
**Parent:** `2026-07-24-section-configuration-week-schedule-design.md`  
**Visual:** brainstorm companion `calendar-fantastical-a-v2.html` → choice **A2**

## Intent

Restyle the Configuration week schedule to a **Fantastical-like** single-surface calendar and move the block inspector into a **right drawer that opens only when a block is selected** (A2), without changing snap/overlap/save contracts.

## Locked decisions

| Topic | Choice |
|-------|--------|
| Visual direction | **A** — clean white surface, left hour gutter, soft dashed hour lines, rounded pastel blocks, subtle day column separators (no heavy bordered day cells / muted washes) |
| Days | **Lun → Dom** (unchanged) |
| Inspector | **A2** — full-width grid; slide-over / drawer on the right when `selectedIndex !== null`; dismiss clears selection (ESC + close control) |
| Interactions | Keep: click empty → create; drag move; bottom resize; snap 15′; unsaved dashed/tint; dragging primary fill; explicit **Guardar horario** |
| Settings Zone A | Unchanged (AreaBlock chrome already shipped) |

## Layout details

1. **Grid chrome**  
   - Remove per-day muted fills and heavy outer “form” framing inside the schedule AreaBlock content.  
   - Continuous week surface; hour labels left; dashed horizontal hour rules across days; light vertical day dividers only.  
   - Keep breathing room (existing px/hour scale or slight tweak if drawer needs height).

2. **Drawer**  
   - Opens when user selects a block (click or after create).  
   - Contains current inspector fields (day, start, end, delete) + accessible focus trap / `role="dialog"` or `complementary` with labelled heading from dict.  
   - Close: button (Lucide `X`, `16` + dict `aria-label`), Escape, optional click-outside **only on overlay** if we use a scrim; prefer **no full-page dim** so the calendar stays usable (drawer overlays the right ~320px of the grid area, or sits in a panel that slides over the grid’s right edge).  
   - When nothing selected: drawer closed; grid uses full width.

3. **Toolbar**  
   - Keep create hint + unsaved badge + Save under the AreaBlock header (already there).

## Architecture

| Piece | Change |
|-------|--------|
| `AcademicSectionWeekScheduleEditor` | Stop side-by-side `lg:grid-cols-[1fr_320px]`; compose grid + drawer overlay |
| `AcademicSectionWeekScheduleBlockInspector` | Reuse form body; wrap in drawer shell (new thin molecule/organism ≤250 LOC) or add `variant="drawer"` |
| `AcademicSectionWeekScheduleGrid*` | Visual-only restyle (classes); pass selection callbacks unchanged |
| Pure libs / hook | No behavior change required |

## i18n

- Add close control copy if missing (`scheduleEditor.closeInspector` / `aria`) in **en / es / pt**.  
- Reuse existing inspector field keys.

## Testing

- RTL: selecting a block opens drawer (heading / close visible); close clears selection / hides drawer.  
- Existing create/save/unsaved/dragging tests still pass.  
- Self-contained harness (`30`).

## Done when

- [x] Calendar matches A visual (single surface + gutter + dashed hours + pastel blocks).  
- [x] Inspector only in A2 drawer when a block is selected; full-width grid otherwise.  
- [x] ESC + close button dismiss drawer; focus management OK.  
- [x] Vitest green for editor + new drawer smoke.  
- [x] Files ≤250 LOC.

## Out of scope

- FullCalendar library; all-day row; Mon–Fri-only mode; auto-save; changing default duration / overlap rules.

## Manual QA (user)

1. Configuration → schedule looks like a light calendar, not a bordered form grid.  
2. Select block → drawer opens with times; close / ESC → drawer gone, grid full width.  
3. Drag/unsaved/save still work.

## Risks

| Risk | Mitigation |
|------|------------|
| Drawer covering Friday–Sunday | Cap width (~280–320px); keep day headers visible; user can dismiss |
| Focus trap fighting drag | Trap only when drawer open; don’t capture pointers on grid while dragging |
