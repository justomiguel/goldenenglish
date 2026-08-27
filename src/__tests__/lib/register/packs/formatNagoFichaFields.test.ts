import { describe, expect, it } from "vitest";
import {
  formatNagoCareDietNote,
  formatNagoCareHealthNote,
  formatNagoHomeAddress,
} from "@/lib/register/packs/nago/formatNagoFichaFields";
import { validNagoExtras } from "@/__tests__/lib/register/packs/nagoExtrasFixture";

const labels = {
  insurance: "Previsión",
  bloodType: "Grupo",
  condition: "Condición",
  healthCenter: "Centro",
  allergies: "Alergias",
  none: "No",
};

describe("formatNagoFichaFields", () => {
  it("joins address and commune", () => {
    expect(formatNagoHomeAddress(validNagoExtras())).toBe("Av. Principal 100, Santiago");
  });

  it("formats a health note with labeled lines", () => {
    const note = formatNagoCareHealthNote(validNagoExtras(), labels);
    expect(note).toBe(
      ["Previsión: fonasa", "Grupo: O+", "Condición: No", "Centro: Hospital Sótero del Río"].join(
        "\n",
      ),
    );
  });

  it("uses the other-insurance specify string", () => {
    const note = formatNagoCareHealthNote(
      validNagoExtras({ healthInsurance: "other", healthInsuranceOther: "Particular" }),
      labels,
    );
    expect(note).toContain("Previsión: Particular");
  });

  it("formats allergies or none", () => {
    expect(formatNagoCareDietNote(validNagoExtras(), labels)).toBe("Alergias: No");
    expect(
      formatNagoCareDietNote(validNagoExtras({ hasAllergies: true, allergiesDetail: "Maní" }), labels),
    ).toBe("Alergias: Maní");
  });
});
