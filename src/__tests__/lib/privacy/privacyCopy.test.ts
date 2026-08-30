import { describe, expect, it } from "vitest";
import { interpolatePrivacyCopy } from "@/lib/privacy/interpolatePrivacyCopy";
import { privacyControllerFields } from "@/lib/privacy/privacyControllerFields";
import { privacyPagePath } from "@/lib/privacy/privacyPagePath";
import { splitPrivacyConsentLabel } from "@/lib/privacy/splitPrivacyConsentLabel";

describe("privacy copy helpers", () => {
  it("interpolates the institute legal name and contact fields", () => {
    expect(
      interpolatePrivacyCopy("En {{brand}} escribinos a {{email}} o {{phone}}.", {
        brand: "Nagô",
        email: "hola@nago.cl",
        phone: "+56 9 1111",
        address: "",
        registry: "",
      }),
    ).toBe("En Nagô escribinos a hola@nago.cl o +56 9 1111.");
  });

  it("uses the tenant legal name and skips blank contact lines", () => {
    expect(
      privacyControllerFields({
        legalName: "Escuela Nagô SpA",
        name: "Nagô",
        legalRegistry: "76.123.456-7",
        contactEmail: "  hola@nago.cl ",
        contactPhone: "",
        contactAddress: "Santiago",
      }),
    ).toEqual({
      brand: "Escuela Nagô SpA",
      registry: "76.123.456-7",
      email: "hola@nago.cl",
      phone: "",
      address: "Santiago",
    });
  });

  it("builds the public privacy path", () => {
    expect(privacyPagePath("es")).toBe("/es/privacidad");
  });

  it("splits the consent label around the privacy link token", () => {
    expect(
      splitPrivacyConsentLabel("Acepto los {privacyLink} para esta preinscripción."),
    ).toEqual({
      before: "Acepto los ",
      after: " para esta preinscripción.",
    });
  });
});
