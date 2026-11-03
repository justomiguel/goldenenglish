import { isGenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import type { ThemeProperties } from "@/lib/theme/themeParser";

const CLEAR_WHEN_BLANK = [
  "contact.email",
  "contact.phone",
  "contact.address",
  "social.facebook",
  "social.instagram",
  "social.whatsapp",
  "app.tagline",
  "app.tagline.en",
  "app.legal.registry",
] as const;

/** A generic theme shows only the contact and social values the owner saved. */
export function hideUnsetGenericContact(
  merged: ThemeProperties,
  overrides: Readonly<Record<string, string>> | null | undefined,
  templateKind: string | null | undefined,
): ThemeProperties {
  if (!isGenericInstituteKind(templateKind)) return merged;
  const next = { ...merged };
  for (const key of CLEAR_WHEN_BLANK) {
    const raw = overrides?.[key];
    const value = typeof raw === "string" ? raw.trim() : "";
    if (value) next[key] = value;
    else delete next[key];
  }
  return next;
}
