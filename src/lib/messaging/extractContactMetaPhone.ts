import type { CountryCode } from "libphonenumber-js";
import { resolveWhatsAppDigits } from "@/lib/whatsapp/resolveWhatsAppDigits";

const PHONE_RE = /\+?\d[\d\s().-]{6,}\d/g;

/** Phone-like tokens in the contact block (text before the first `<hr>`). */
export function contactMetaPhoneCandidates(html: string): string[] {
  const head = String(html ?? "").split(/<hr\b/i)[0] ?? "";
  const text = head.replace(/<[^>]+>/g, " ");
  return [...text.matchAll(PHONE_RE)].map((match) => match[0].trim());
}

export function resolveContactWhatsAppDigits(
  html: string,
  country: CountryCode | null,
): string | null {
  for (const candidate of contactMetaPhoneCandidates(html)) {
    const digits = resolveWhatsAppDigits(candidate, country);
    if (digits) return digits;
  }
  return null;
}
