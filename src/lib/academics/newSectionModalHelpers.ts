/** Default section period when opening the new-section modal (today until staff adjusts). */
export function defaultSectionPeriodInitial(): { startsOn: string; endsOn: string } {
  const today = new Date().toISOString().slice(0, 10);
  return { startsOn: today, endsOn: today };
}

export function parseCustomMaxStudents(
  customizeMax: boolean,
  maxRaw: string,
): { ok: true; value: number | null } | { ok: false } {
  if (!customizeMax) return { ok: true, value: null };
  const n = Number.parseInt(maxRaw.trim(), 10);
  if (maxRaw.trim() === "" || !Number.isFinite(n) || n < 1) return { ok: false };
  return { ok: true, value: Math.floor(n) };
}
