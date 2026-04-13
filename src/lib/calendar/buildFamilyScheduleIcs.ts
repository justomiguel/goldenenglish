function foldIcsText(s: string) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function icsUtc(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * Single one-hour placeholder event with a human-readable schedule in DESCRIPTION.
 * Reliable across time zones; parents still get a calendar anchor + full text.
 */
export function buildPlainTextFamilyScheduleIcs(params: { title: string; body: string }): string {
  const start = new Date();
  start.setUTCMinutes(0, 0, 0);
  start.setUTCHours(start.getUTCHours() + 2);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const uid = `ge-family-hub-${start.getTime()}@goldenenglish`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GE//Family Hub//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${icsUtc(new Date())}`,
    `DTSTART:${icsUtc(start)}`,
    `DTEND:${icsUtc(end)}`,
    `SUMMARY:${foldIcsText(params.title)}`,
    `DESCRIPTION:${foldIcsText(params.body)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
