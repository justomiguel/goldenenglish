/** Pure: reads completion timestamp from site_settings.value for key initial_site_setup. */
export function parseInitialSiteSetupCompletedAt(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const v = (raw as Record<string, unknown>).completedAt;
  if (typeof v !== "string" || !v.trim()) return null;
  return v.trim();
}
