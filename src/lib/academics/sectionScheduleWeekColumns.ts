/** Mon (1) through Sun (0) column order for the week grid UI. */
export const SECTION_WEEK_UI_DAY_ORDER: readonly number[] = [1, 2, 3, 4, 5, 6, 0];

/** Maps dayOfWeek (0=Sun … 6=Sat) to a 0-based Mon-first column index. */
export function sectionWeekUiColumnIndex(dayOfWeek: number): number {
  const idx = SECTION_WEEK_UI_DAY_ORDER.indexOf(dayOfWeek);
  return idx >= 0 ? idx : 0;
}
