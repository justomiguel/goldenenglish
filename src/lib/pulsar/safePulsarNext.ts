/** Same-origin path after Pulsar sign-in. Rejects other locales and off-site URLs. */
export function safePulsarNext(locale: string, next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith(`/${locale}/`)) return null;
  if (next.includes("://") || next.includes("\\") || next.includes("//")) return null;
  return next;
}
