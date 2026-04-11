/**
 * Converts common spreadsheet date strings to ISO `YYYY-MM-DD`.
 * Accepts existing ISO dates, and `DD/MM/YY`, `MM/DD/YY` (when unambiguous).
 */
export function normalizeBirthDateString(raw: string): string | undefined {
  const s = raw.trim();
  if (!s) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const parts = s.split(/[/.\-]/).map((p) => p.trim());
  if (parts.length !== 3) return undefined;
  const nums = parts.map((p) => Number.parseInt(p, 10));
  if (nums.some((n) => Number.isNaN(n))) return undefined;
  const [a, b, c] = nums;

  let y = c;
  if (y < 100) y = y >= 30 ? 1900 + y : 2000 + y;

  const tryIso = (day: number, month: number, year: number) => {
    if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
    const d = new Date(Date.UTC(year, month - 1, day));
    if (
      d.getUTCFullYear() !== year ||
      d.getUTCMonth() !== month - 1 ||
      d.getUTCDate() !== day
    ) {
      return undefined;
    }
    return d.toISOString().slice(0, 10);
  };

  const ddmm = tryIso(a, b, y);
  if (ddmm) return ddmm;

  const mmdd = tryIso(b, a, y);
  if (mmdd) return mmdd;

  return undefined;
}
