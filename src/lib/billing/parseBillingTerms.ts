import type { Locale } from "@/types/i18n";

export interface BillingTermsParsed {
  enrollment: { es: string; en: string };
  monthly: { es: string; en: string };
  promotion: { es: string; en: string };
}

const DEFAULTS: BillingTermsParsed = {
  enrollment: { es: "Matrícula", en: "Enrollment fee" },
  monthly: { es: "Mensualidad", en: "Monthly fee" },
  promotion: { es: "Promoción", en: "Promotion" },
};

function readLocalized(
  raw: unknown,
  fallback: { es: string; en: string },
): { es: string; en: string } {
  if (!raw || typeof raw !== "object") return fallback;
  const r = raw as Record<string, unknown>;
  return {
    es: typeof r.es === "string" && r.es.trim() ? r.es.trim() : fallback.es,
    en: typeof r.en === "string" && r.en.trim() ? r.en.trim() : fallback.en,
  };
}

/** Pure: takes `site_settings.value` for `billing_terms` and returns the
 *  bilingual term map. Falls back to Golden defaults when missing. */
export function parseBillingTerms(
  raw: unknown,
  defaults: BillingTermsParsed = DEFAULTS,
): BillingTermsParsed {
  if (!raw || typeof raw !== "object") return defaults;
  const r = raw as Record<string, unknown>;
  return {
    enrollment: readLocalized(r.enrollment, defaults.enrollment),
    monthly: readLocalized(r.monthly, defaults.monthly),
    promotion: readLocalized(r.promotion, defaults.promotion),
  };
}

export function projectBillingTermsForLocale(
  parsed: BillingTermsParsed,
  locale: Locale,
): { enrollment: string; monthly: string; promotion: string } {
  const en = locale === "en";
  return {
    enrollment: en ? parsed.enrollment.en : parsed.enrollment.es,
    monthly: en ? parsed.monthly.en : parsed.monthly.es,
    promotion: en ? parsed.promotion.en : parsed.promotion.es,
  };
}

export const BILLING_TERMS_DEFAULTS = DEFAULTS;
