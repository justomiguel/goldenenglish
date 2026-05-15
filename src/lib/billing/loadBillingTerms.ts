import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { SYSTEM_PROPERTIES_DEFAULTS } from "@/lib/theme/systemPropertiesDefaults";
import type { Locale } from "@/types/i18n";
import {
  BILLING_TERMS_DEFAULTS,
  parseBillingTerms,
  projectBillingTermsForLocale,
} from "@/lib/billing/parseBillingTerms";

const KEY = "billing_terms";

const TS_DEFAULTS = {
  enrollment: {
    es:
      SYSTEM_PROPERTIES_DEFAULTS["billing.term.enrollment"] ??
      BILLING_TERMS_DEFAULTS.enrollment.es,
    en:
      SYSTEM_PROPERTIES_DEFAULTS["billing.term.enrollment.en"] ??
      BILLING_TERMS_DEFAULTS.enrollment.en,
  },
  monthly: {
    es:
      SYSTEM_PROPERTIES_DEFAULTS["billing.term.monthly"] ??
      BILLING_TERMS_DEFAULTS.monthly.es,
    en:
      SYSTEM_PROPERTIES_DEFAULTS["billing.term.monthly.en"] ??
      BILLING_TERMS_DEFAULTS.monthly.en,
  },
  promotion: {
    es:
      SYSTEM_PROPERTIES_DEFAULTS["billing.term.promotion"] ??
      BILLING_TERMS_DEFAULTS.promotion.es,
    en:
      SYSTEM_PROPERTIES_DEFAULTS["billing.term.promotion.en"] ??
      BILLING_TERMS_DEFAULTS.promotion.en,
  },
};

export const loadBillingTerms = cache(async (locale: Locale) => {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", KEY)
      .maybeSingle();
    const parsed = parseBillingTerms(data?.value, TS_DEFAULTS);
    return projectBillingTermsForLocale(parsed, locale);
  } catch {
    return projectBillingTermsForLocale(TS_DEFAULTS, locale);
  }
});
