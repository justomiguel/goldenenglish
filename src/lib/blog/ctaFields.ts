const CTA_LABEL_MAX = 80;

export type CtaFieldsResult =
  | { ok: true; label: string | null; url: string | null }
  | { ok: false; code: "cta_incomplete" | "cta_url" };

function trimmed(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function isAllowedCtaUrl(url: string): boolean {
  if (url.startsWith("//")) return false;
  return url.startsWith("https://") || url.startsWith("http://") || url.startsWith("/");
}

export function parseCtaFields(input: {
  label: string | null | undefined;
  url: string | null | undefined;
}): CtaFieldsResult {
  const label = trimmed(input.label);
  const url = trimmed(input.url);
  if (label.length === 0 && url.length === 0) {
    return { ok: true, label: null, url: null };
  }
  if (label.length === 0 || url.length === 0 || label.length > CTA_LABEL_MAX) {
    return { ok: false, code: "cta_incomplete" };
  }
  if (!isAllowedCtaUrl(url)) {
    return { ok: false, code: "cta_url" };
  }
  return { ok: true, label, url };
}
