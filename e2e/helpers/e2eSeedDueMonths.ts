/** Mirrors `supabase/seeds/e2e/seed-admin.sql` due-month layout for E2E Student. */
export function e2eSeedDueMonths(now = new Date()) {
  const current = now.getMonth() + 1;
  const parent = current < 12 ? current + 1 : current - 1;
  const reject =
    current <= 10 ? current + 2 : current === 11 ? 9 : 10;
  const record =
    current <= 9 ? current + 3 : current === 10 ? 8 : current === 11 ? 7 : 6;
  return { current, parent, reject, record };
}

/** Month that is not used by student/parent/reject/record payment fixtures. */
export function e2eScholarshipMonth(now = new Date()) {
  const reserved = new Set(Object.values(e2eSeedDueMonths(now)));
  for (const candidate of [12, 1, 2, 3, 4, 5, 6, 7]) {
    if (!reserved.has(candidate)) return candidate;
  }
  return 1;
}

export function monthShortLabel(locale: string, month1to12: number): string {
  const m = Math.min(12, Math.max(1, month1to12));
  return new Intl.DateTimeFormat(locale, { month: "short" }).format(
    new Date(2000, m - 1, 15, 12, 0, 0),
  );
}
