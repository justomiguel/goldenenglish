const TZ = "America/Argentina/Cordoba";

function parts(ms: number, opts: Intl.DateTimeFormatOptions): Record<string, string> {
  const dtf = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, ...opts });
  const out: Record<string, string> = {};
  for (const p of dtf.formatToParts(ms)) {
    if (p.type !== "literal") out[p.type] = p.value;
  }
  return out;
}

/** YYYY-MM-DD in Cordoba civil calendar for this instant. */
export function cordobaIsoDateFromUtcMs(ms: number): string {
  const p = parts(ms, { year: "numeric", month: "2-digit", day: "2-digit" });
  return `${p.year}-${p.month}-${p.day}`;
}

/** HH:mm (24h) in Cordoba for this instant. */
export function cordobaHmFromUtcMs(ms: number): string {
  const p = parts(ms, { hour: "2-digit", minute: "2-digit", hour12: false });
  const h = (p.hour ?? "00").padStart(2, "0");
  const m = (p.minute ?? "00").padStart(2, "0");
  return `${h}:${m}`;
}
