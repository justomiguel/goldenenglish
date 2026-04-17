export type WhatsappQuietWindow = {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
};

function minutesSinceMidnight(h: number, m: number): number {
  return h * 60 + m;
}

/** Parts in a given IANA time zone for an instant (UTC). */
export function wallClockPartsInTimeZone(isoUtc: string, timeZone: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const d = new Date(isoUtc);
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const get = (t: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === t)?.value ?? NaN);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

function isInWhatsappQuiet(isoUtc: string, timeZone: string, quiet: WhatsappQuietWindow): boolean {
  const p = wallClockPartsInTimeZone(isoUtc, timeZone);
  const t = minutesSinceMidnight(p.hour, p.minute);
  const startQuiet = minutesSinceMidnight(quiet.startHour, quiet.startMinute);
  const endAllowed = minutesSinceMidnight(quiet.endHour, quiet.endMinute);
  return t >= startQuiet || t < endAllowed;
}

/**
 * If local wall time falls in WhatsApp quiet hours, advance minute-by-minute until
 * outside the window (bounded).
 */
export function shiftUtcInstantOutOfWhatsappQuiet(
  sendAtUtcIso: string,
  timeZone: string,
  quiet: WhatsappQuietWindow,
): string {
  let t = new Date(sendAtUtcIso).getTime();
  if (!isInWhatsappQuiet(new Date(t).toISOString(), timeZone, quiet)) {
    return new Date(t).toISOString();
  }
  const maxSteps = 24 * 60 * 8;
  for (let i = 0; i < maxSteps; i += 1) {
    t += 60 * 1000;
    if (!isInWhatsappQuiet(new Date(t).toISOString(), timeZone, quiet)) {
      return new Date(t).toISOString();
    }
  }
  return sendAtUtcIso;
}
