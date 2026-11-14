import { describe, expect, it } from "vitest";
import { enrollmentFeeChargeCurrency } from "@/lib/register/enrollmentFeeChargeCurrency";

describe("enrollmentFeeChargeCurrency", () => {
  it("uses the institute currency when the snapshot still has the default", () => {
    expect(enrollmentFeeChargeCurrency("USD", "CLP")).toBe("CLP");
  });

  it("keeps a snapshot currency that is not the default", () => {
    expect(enrollmentFeeChargeCurrency("ARS", "CLP")).toBe("ARS");
  });

  it("keeps USD when the institute also bills in USD", () => {
    expect(enrollmentFeeChargeCurrency("USD", "USD")).toBe("USD");
  });
});
