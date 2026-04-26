/**
 * Decodes a `returnTo` (path + query) for in-app back navigation. Rejects
 * open redirects (full URLs, //, other locales, or paths outside this app’s dashboard).
 */
export function parseSafeLocaleDashboardPath(
  locale: string,
  raw: string | string[] | undefined,
): string | null {
  if (raw == null) return null;
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (s == null || s.length > 2000) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(s);
  } catch {
    return null;
  }
  if (decoded.startsWith("http://") || decoded.startsWith("https://") || decoded.startsWith("//")) {
    return null;
  }
  if (decoded.includes("..")) return null;
  if (!decoded.startsWith(`/${locale}/dashboard/`)) return null;
  if (decoded.includes("://") || decoded.includes("\\\\")) return null;
  if (/\s/.test(decoded.split("?")[0] ?? "")) return null;
  return decoded;
}
