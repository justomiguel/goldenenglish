/** Google Calendar create-event URL (TEMPLATE action) for a one-off event. */
export function googleCalendarEventUrl(params: {
  title: string;
  details?: string;
  start: Date;
  end: Date;
}): string {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const u = new URL("https://calendar.google.com/calendar/render");
  u.searchParams.set("action", "TEMPLATE");
  u.searchParams.set("text", params.title);
  if (params.details) u.searchParams.set("details", params.details);
  u.searchParams.set("dates", `${fmt(params.start)}/${fmt(params.end)}`);
  return u.toString();
}
