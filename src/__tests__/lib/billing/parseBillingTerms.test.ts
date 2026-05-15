import { describe, expect, it } from "vitest";
import {
  BILLING_TERMS_DEFAULTS,
  parseBillingTerms,
  projectBillingTermsForLocale,
} from "@/lib/billing/parseBillingTerms";

describe("parseBillingTerms", () => {
  it("returns canonical defaults when the row is missing", () => {
    expect(parseBillingTerms(null)).toEqual(BILLING_TERMS_DEFAULTS);
    expect(parseBillingTerms(undefined)).toEqual(BILLING_TERMS_DEFAULTS);
  });

  it("returns canonical defaults when shape is wrong", () => {
    expect(parseBillingTerms("garbage")).toEqual(BILLING_TERMS_DEFAULTS);
    expect(parseBillingTerms(42)).toEqual(BILLING_TERMS_DEFAULTS);
  });

  it("merges partial localized overrides over defaults", () => {
    const parsed = parseBillingTerms({
      enrollment: { es: "Inscripción" },
    });
    expect(parsed.enrollment.es).toBe("Inscripción");
    expect(parsed.enrollment.en).toBe(BILLING_TERMS_DEFAULTS.enrollment.en);
    expect(parsed.monthly).toEqual(BILLING_TERMS_DEFAULTS.monthly);
  });

  it("ignores empty strings", () => {
    const parsed = parseBillingTerms({
      promotion: { es: "   ", en: "" },
    });
    expect(parsed.promotion).toEqual(BILLING_TERMS_DEFAULTS.promotion);
  });

  it("projects to a locale-specific shape", () => {
    const parsed = parseBillingTerms({
      enrollment: { es: "Matrícula custom", en: "Custom enrollment" },
    });
    expect(projectBillingTermsForLocale(parsed, "es").enrollment).toBe(
      "Matrícula custom",
    );
    expect(projectBillingTermsForLocale(parsed, "en").enrollment).toBe(
      "Custom enrollment",
    );
  });
});
