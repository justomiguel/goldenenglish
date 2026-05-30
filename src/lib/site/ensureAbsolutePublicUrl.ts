/** Turn a site-relative or absolute public asset URL into an absolute URL for PDF/email contexts. */
export function ensureAbsolutePublicUrl(maybeRelative: string, siteOrigin: string): string {
  const trimmed = maybeRelative.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed)) return trimmed;
  const origin = siteOrigin.replace(/\/+$/, "");
  if (trimmed.startsWith("/")) return `${origin}${trimmed}`;
  return `${origin}/${trimmed}`;
}
