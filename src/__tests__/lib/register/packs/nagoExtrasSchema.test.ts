import { describe, expect, it } from "vitest";
import { buildNagoExtrasSchema } from "@/lib/register/packs/nago/schema";
import { validNagoExtras } from "@/__tests__/lib/register/packs/nagoExtrasFixture";

describe("buildNagoExtrasSchema", () => {
  const minor = buildNagoExtrasSchema({ isMinor: true });
  const adult = buildNagoExtrasSchema({ isMinor: false });

  it("accepts the happy-path fixture for a minor", () => {
    expect(minor.safeParse(validNagoExtras()).success).toBe(true);
  });

  it("requires school when the student is a minor", () => {
    const r = minor.safeParse(validNagoExtras({ school: "" }));
    expect(r.success).toBe(false);
  });

  it("allows empty school for an adult", () => {
    const r = adult.safeParse(validNagoExtras({ school: "" }));
    expect(r.success).toBe(true);
  });

  it("requires a specify string when insurance is other", () => {
    const r = adult.safeParse(
      validNagoExtras({ healthInsurance: "other", healthInsuranceOther: "" }),
    );
    expect(r.success).toBe(false);
  });

  it("requires allergy detail when hasAllergies", () => {
    const r = adult.safeParse(validNagoExtras({ hasAllergies: true, allergiesDetail: "" }));
    expect(r.success).toBe(false);
  });

  it("requires condition detail when hasMedicalCondition", () => {
    const r = adult.safeParse(
      validNagoExtras({ hasMedicalCondition: true, medicalConditionDetail: "" }),
    );
    expect(r.success).toBe(false);
  });

  it("rejects a stale protocol version", () => {
    const r = adult.safeParse(
      validNagoExtras({
        protocol: {
          version: "2025-01",
          acceptedAt: "2026-08-25T12:00:00.000Z",
          signerName: "Ana Pérez",
          signerDni: "11111111-1",
        },
      }),
    );
    expect(r.success).toBe(false);
  });

  it("strips unknown keys", () => {
    const r = adult.safeParse({ ...validNagoExtras(), extra: "nope" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).not.toHaveProperty("extra");
  });
});
