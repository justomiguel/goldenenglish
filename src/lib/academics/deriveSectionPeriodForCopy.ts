const iso = (s: string | null | undefined): string | null =>
  s && /^\d{4}-\d{2}-\d{2}$/.test(s.trim()) ? s.trim() : null;

/**
 * Section dates when copying into another cohort: reuse the source section’s
 * period when valid; otherwise fall back to today for both bounds.
 */
export function deriveSectionPeriodForCopy(input: {
  sourceStartsOn: string | null;
  sourceEndsOn: string | null;
}): { starts_on: string; ends_on: string } {
  const today = new Date().toISOString().slice(0, 10);
  let s = iso(input.sourceStartsOn) ?? today;
  let e = iso(input.sourceEndsOn) ?? s;
  if (s > e) {
    s = today;
    e = today;
  }
  return { starts_on: s, ends_on: e };
}
