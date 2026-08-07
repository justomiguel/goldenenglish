import parsePhoneNumberFromString, { type CountryCode } from "libphonenumber-js";

/**
 * Country used as the default when a family types a local number. Read from the
 * institute's own `contact.phone` (`brand.contactPhone`), which the site-setup
 * wizard already requires, so no extra setting is needed.
 */
export function resolveWhatsAppCountry(
  institutePhone: string | null | undefined,
): CountryCode | null {
  const raw = (institutePhone ?? "").trim();
  if (!raw.startsWith("+")) return null;
  return parsePhoneNumberFromString(raw)?.country ?? null;
}

/**
 * E.164 digits without the leading `+`, ready for `https://wa.me/<digits>`.
 * Returns null when the number cannot be resolved, so callers hide the action
 * instead of opening a chat with a wrong number.
 */
export function resolveWhatsAppDigits(
  phone: string | null | undefined,
  country: CountryCode | null,
): string | null {
  const raw = (phone ?? "").trim();
  if (!raw) return null;

  const parsed = raw.startsWith("+")
    ? parsePhoneNumberFromString(raw)
    : country
      ? parsePhoneNumberFromString(raw, country)
      : null;

  if (!parsed || !parsed.isValid()) return null;
  return parsed.number.replace(/^\+/, "");
}
