export function formatParentLastAccess(
  iso: string | null | undefined,
  locale: string,
  neverLabel: string,
): string {
  if (!iso) return neverLabel;
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return neverLabel;
  const diffSec = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (abs < 60) return rtf.format(diffSec, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 86400 * 45) return rtf.format(Math.round(diffSec / 86400), "day");
  return new Date(iso).toLocaleDateString(locale);
}
