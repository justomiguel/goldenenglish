import { describe, expect, it } from "vitest";
import {
  customLandingAmount,
  formatOfferAmount,
  publishedMonthlyAmount,
  publishedSetupOffer,
} from "@/lib/pulsar/centrolistoCommercialOffer";

// REGRESSION CHECK: Chile list prices stay published. Other countries use the static table.
describe("centrolistoCommercialOffer", () => {
  it("publishes Chile monthly amounts and the custom landing fee", () => {
    expect(publishedMonthlyAmount("presencia")).toBe(0);
    expect(publishedMonthlyAmount("gestion")).toBe(29990);
    expect(publishedMonthlyAmount("ecosistema")).toBe(69990);
    expect(customLandingAmount()).toBe(149990);
    expect(publishedSetupOffer("gestionAssisted")).toBeNull();
    expect(formatOfferAmount(29990, "cl")).toContain("29.990");
    expect(formatOfferAmount(69990, "cl")).toContain("69.990");
  });

  it("formats each country in its own currency", () => {
    expect(publishedMonthlyAmount("gestion", "ar")).toBe(44900);
    expect(publishedMonthlyAmount("ecosistema", "ar")).toBe(99900);
    expect(publishedMonthlyAmount("ecosistema", "uy")).toBe(2830);
    expect(publishedMonthlyAmount("gestion", "py")).toBe(180000);
    expect(customLandingAmount("ar")).toBe(232300);
    expect(formatOfferAmount(44900, "ar")).toContain("44.900");
    expect(formatOfferAmount(99900, "ar")).toContain("99.900");
    expect(formatOfferAmount(1210, "uy")).toContain("1.210");
    expect(formatOfferAmount(180000, "py")).toContain("180.000");
    expect(publishedSetupOffer("customLanding", "py")?.amount).toBe(898000);
  });
});
