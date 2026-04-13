/** Human-readable summary of `academic_sections.schedule_slots` JSON. */

type Slot = { dayOfWeek?: number; startTime?: string; endTime?: string };

function asSlots(raw: unknown): Slot[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is Slot => x !== null && typeof x === "object");
}

export function formatAcademicScheduleSummary(raw: unknown, locale: string): string {
  const slots = asSlots(raw);
  if (slots.length === 0) return "";

  const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const base = new Date(Date.UTC(2024, 0, 7)); // Sunday UTC anchor

  const parts = slots.map((s) => {
    const d = typeof s.dayOfWeek === "number" ? s.dayOfWeek : -1;
    const day =
      d >= 0 && d <= 6
        ? fmt.format(new Date(base.getTime() + d * 86400000))
        : "—";
    const st = typeof s.startTime === "string" ? s.startTime.trim() : "";
    const en = typeof s.endTime === "string" ? s.endTime.trim() : "";
    if (st && en) return `${day} ${st}–${en}`;
    if (st) return `${day} ${st}`;
    return day;
  });

  return parts.join(" · ");
}
