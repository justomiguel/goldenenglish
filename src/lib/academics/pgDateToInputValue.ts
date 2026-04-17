/** Normalizes PostgREST `date` / ISO timestamps for `<input type="date">` (YYYY-MM-DD). */
export function pgDateToInputValue(value: unknown): string {
  if (value == null) return "";
  const raw = typeof value === "string" ? value : String(value);
  const ymd = raw.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? ymd : "";
}

/** For rules that compare civil dates; `null` when missing or not parseable as YYYY-MM-DD. */
export function sectionCalendarDateIsoOrNull(value: unknown): string | null {
  const s = pgDateToInputValue(value);
  return s || null;
}
