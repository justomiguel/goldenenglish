/** Allow only https and mailto links in calendar meeting URLs (defense in depth). */
export function safeCalendarMeetingHref(url: string | null | undefined): string | null {
  if (url == null || typeof url !== "string") return null;
  const t = url.trim();
  if (t.startsWith("https://")) return t;
  if (t.startsWith("mailto:")) return t;
  return null;
}
