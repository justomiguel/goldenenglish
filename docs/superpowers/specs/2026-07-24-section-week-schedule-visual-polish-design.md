# Section week schedule — visual polish (spacing + draft/drag colors)

**Status:** Approved  
**Parent:** `docs/superpowers/specs/2026-07-24-section-configuration-week-schedule-design.md`

## Intent

Make the Configuration week grid feel closer to a calendar product (breathing room, clear hour bands) and make **draft vs saved** and **active drag** states obvious by color—without changing save/overlap contracts.

## Understanding

- Current grid is dense: short hour rows, tight day gutters, muted day fills stack visually.
- Dragging a block does not change its appearance.
- Unsaved edits only show a header badge; individual blocks look the same as persisted ones.

## Decisions

1. **Spacing (calendar-like)**  
   - Increase vertical scale (`px` per 15′ step) so each hour band is taller and labels/lines are easier to scan.  
   - Widen left time gutter; increase column gap; day columns on a clean surface (avoid heavy per-day muted wash that makes everything look packed).  
   - Keep dotted hour lines; optional subtler half-hour ticks only if they stay unobtrusive.

2. **Unsaved block color**  
   - A block is **unsaved** when its exact `(dayOfWeek, startTime, endTime)` is not accounted for in the persisted `initialSlots` multiset (same compare key as draft dirty logic).  
   - Unsaved → distinct filled token style (e.g. primary-tint / dashed or stronger border).  
   - Saved (still matching initial) → calmer neutral/primary-soft fill.  
   - Pure helper preferred (`isSectionScheduleSlotUnsaved(slot, initialSlots)` or multiset matcher) for Vitest.

3. **Drag / resize active color**  
   - While pointer capture move or resize is active, the active block uses a third, stronger “moving” style (e.g. primary fill + elevated ring/shadow) so feedback is immediate.  
   - Clear on pointer up/cancel. Resize uses the same active style.

4. **Tokens only** — brand CSS vars (`primary`, `primary-foreground`, `muted`, `border`, `surface`); no ad-hoc hex. Contrast AA on labels (`26`).

## Done when

- [x] Grid has visibly more vertical and horizontal breathing room than before.  
- [x] Blocks that differ from last-saved schedule use the unsaved style; matching ones use saved style.  
- [x] Block under drag/resize uses the active style until pointer up.  
- [x] Vitest covers unsaved matcher + RTL smoke for unsaved/active classes or `data-*` attributes.  
- [x] Files stay ≤250 LOC; dict only if new aria/visible chrome strings are needed (prefer `data-state` + existing unsaved badge).

## Out of scope

- Changing snap/overlap/save APIs or default duration rules.  
- Full Fantastical theming (all-day row, location chips, multi-color event types).  
- Auto-save on drop.

## Risks

| Risk | Mitigation |
|------|------------|
| Color-only signaling | Keep selected ring + unsaved header badge; optional `data-schedule-state` for tests/a11y |
| Multiset edge (two identical slots) | Count keys; each draft slot consumes one matching initial key |

## Manual QA (user)

1. Load a section with saved slots → blocks look “saved”.  
2. Move one block without saving → that block (new position) looks unsaved; untouched matching slots stay saved.  
3. Drag → color changes while dragging; settles to unsaved style after drop if dirty.  
4. Save → all blocks return to saved style; dirty badge clears.
