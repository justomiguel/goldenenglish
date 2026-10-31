import { describe, expect, it } from "vitest";
import {
  CENTROLISTO_COMMERCIAL_OFFER,
  formatOfferAmount,
  publishedMonthlyAmount,
} from "@/lib/pulsar/centrolistoCommercialOffer";

describe("centrolistoCommercialOffer", () => {
  it("publishes the Chile monthly amounts and hides pending markets", () => {
    expect(publishedMonthlyAmount("presencia")).toBe(0);
    expect(publishedMonthlyAmount("gestion")).toBe(29990);
    expect(publishedMonthlyAmount("ecosistema")).toBe(69990);
    expect(CENTROLISTO_COMMERCIAL_OFFER.pending.argentina.status).toBe("pending");
    expect(CENTROLISTO_COMMERCIAL_OFFER.pending.activeStudentCap.status).toBe("pending");
    expect(formatOfferAmount(29990, "es")).toContain("29.990");
    expect(formatOfferAmount(69990, "es")).toContain("69.990");
  });
});
