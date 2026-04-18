import { getProperty, loadProperties } from "@/lib/theme/themeParser";
import type { Locale } from "@/types/i18n";

export type BillingTerms = {
  enrollment: string;
  monthly: string;
  promotion: string;
};

export function getBillingTerms(locale: Locale): BillingTerms {
  const p = loadProperties();
  const en = locale === "en";
  return {
    enrollment: en
      ? getProperty(p, "billing.term.enrollment.en", "Enrollment fee")
      : getProperty(
          p,
          "billing.term.enrollment",
          getProperty(p, "billing.term.enrollment.en", "Enrollment fee"),
        ),
    monthly: en
      ? getProperty(p, "billing.term.monthly.en", "Monthly fee")
      : getProperty(p, "billing.term.monthly", getProperty(p, "billing.term.monthly.en", "Monthly fee")),
    promotion: en
      ? getProperty(p, "billing.term.promotion.en", "Promotion")
      : getProperty(p, "billing.term.promotion", getProperty(p, "billing.term.promotion.en", "Promotion")),
  };
}
