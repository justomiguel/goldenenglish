export type SiteSetupSocialKind = "facebook" | "instagram" | "whatsapp";

/**
 * Converts wizard social inputs to absolute http(s) URLs for persistence / Zod `.url()`.
 * Empty → undefined (optional field omitted).
 */
export function coerceSiteSetupSocialUrl(
  raw: string | undefined,
  kind: SiteSetupSocialKind,
): string | undefined {
  if (raw === undefined) return undefined;
  const t = raw.trim();
  if (!t) return undefined;

  let s = t;
  if (kind === "instagram" && s.startsWith("@")) {
    const handle = s.slice(1).replace(/^\/+|\/+$/g, "");
    if (!handle) return undefined;
    s = `https://www.instagram.com/${handle}/`;
  }

  if (kind === "whatsapp") {
    const digits = s.replace(/\D/g, "");
    if (digits.length >= 8 && !/^https?:\/\//i.test(s)) {
      s = `https://wa.me/${digits}`;
    }
  }

  if (!/^https?:\/\//i.test(s)) {
    s = `https://${s.replace(/^\/+/, "")}`;
  }

  try {
    const parsed = new URL(s);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
    return parsed.href.length > 500 ? undefined : parsed.href;
  } catch {
    return undefined;
  }
}

/** Applies `coerceSiteSetupSocialUrl` to wizard payload social keys before Zod (strict `.url()`). */
export function coerceInitialSiteSetupSocialFields(raw: unknown):
  | { ok: true; value: unknown }
  | { ok: false; code: "invalid_input" } {
  if (raw === null || typeof raw !== "object") return { ok: true, value: raw };
  const o = raw as Record<string, unknown>;
  const next: Record<string, unknown> = { ...o };
  const fields: [field: string, kind: SiteSetupSocialKind][] = [
    ["socialFacebook", "facebook"],
    ["socialInstagram", "instagram"],
    ["socialWhatsapp", "whatsapp"],
  ];
  for (const [key, kind] of fields) {
    const v = next[key];
    if (v === undefined || v === null) continue;
    if (typeof v !== "string") return { ok: false, code: "invalid_input" };
    const t = v.trim();
    if (!t) {
      next[key] = undefined;
      continue;
    }
    const c = coerceSiteSetupSocialUrl(v, kind);
    if (!c) return { ok: false, code: "invalid_input" };
    next[key] = c;
  }
  return { ok: true, value: next };
}
