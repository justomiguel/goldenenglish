import type { CountryCode } from "libphonenumber-js";
import { fullYearsFromIsoDate } from "@/lib/register/ageFromBirthDate";
import { resolveWhatsAppDigits } from "@/lib/whatsapp/resolveWhatsAppDigits";
import type { AdminRegistrationRow } from "@/types/adminRegistration";

export interface RegistrationContactEntry {
  /** Guardian name for the tutor entry; null for the student's own phone. */
  label: string | null;
  phoneDisplay: string;
  /** Null hides the WhatsApp action so we never open a chat with a wrong number. */
  whatsAppDigits: string | null;
}

export interface RegistrationContactView {
  isMinor: boolean;
  student: RegistrationContactEntry | null;
  tutor: RegistrationContactEntry | null;
}

export interface ResolveRegistrationContactOptions {
  legalAgeMajority: number;
  country: CountryCode | null;
  today?: Date;
}

function toEntry(
  label: string | null,
  phone: string | null,
  country: CountryCode | null,
): RegistrationContactEntry | null {
  const display = (phone ?? "").trim();
  if (!display) return null;
  return {
    label,
    phoneDisplay: display,
    whatsAppDigits: resolveWhatsAppDigits(display, country),
  };
}

/**
 * Which phones the admin list shows for a registration. Minors usually arrive
 * with an empty `phone` and a tutor phone, so the tutor entry carries the real
 * contact. A missing birth date counts as adult: hiding the only phone on file
 * would be worse than showing it.
 */
export function resolveRegistrationContact(
  row: AdminRegistrationRow,
  opts: ResolveRegistrationContactOptions,
): RegistrationContactView {
  const isMinor =
    row.birth_date != null &&
    fullYearsFromIsoDate(row.birth_date, opts.today ?? new Date()) < opts.legalAgeMajority;

  return {
    isMinor,
    student: toEntry(null, row.phone, opts.country),
    tutor: toEntry(row.tutor_name, row.tutor_phone, opts.country),
  };
}
