const PII_KEYS =
  /^(email|name|first_name|last_name|phone|dni|document|password|token|address|street)$/i;

export type SafeMetadata = Record<string, string | number | boolean | null>;

/** Strips keys that look like PII; keeps route context safe for UX analytics. */
export function sanitizeAnalyticsMetadata(
  input: Record<string, unknown>,
): SafeMetadata {
  const out: SafeMetadata = {};
  for (const [k, v] of Object.entries(input)) {
    if (PII_KEYS.test(k) || k.includes("email")) continue;
    if (typeof v === "string") {
      out[k] = v.length > 500 ? `${v.slice(0, 500)}…` : v;
    } else if (typeof v === "number" && Number.isFinite(v)) {
      out[k] = v;
    } else if (typeof v === "boolean") {
      out[k] = v;
    } else if (v === null) {
      out[k] = null;
    }
  }
  return out;
}

/**
 * IPv4 → /24 anonymized string valid for Postgres `INET`.
 * IPv6 / odd shapes → `null` (avoids invalid INET from naive truncation, e.g. `::1`).
 */
export function anonymizeIp(ip: string | null): string | null {
  if (!ip?.trim()) return null;
  let t = ip.trim();
  if (t.toLowerCase().startsWith("::ffff:")) {
    t = t.slice(7);
  }
  const ipv4Parts = t.split(".");
  if (
    ipv4Parts.length === 4 &&
    ipv4Parts.every((p) => {
      if (!/^\d{1,3}$/.test(p)) return false;
      const n = Number(p);
      return n >= 0 && n <= 255;
    })
  ) {
    return `${ipv4Parts[0]}.${ipv4Parts[1]}.${ipv4Parts[2]}.0`;
  }
  return null;
}
