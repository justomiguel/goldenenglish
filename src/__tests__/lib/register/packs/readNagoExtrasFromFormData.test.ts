import { describe, expect, it } from "vitest";
import { readNagoExtrasFromFormData } from "@/lib/register/packs/nago/readNagoExtrasFromFormData";

describe("readNagoExtrasFromFormData", () => {
  it("maps form fields into the Nagô extras shape", () => {
    const fd = new FormData();
    fd.set("nago_nationality", "Chilena");
    fd.set("nago_address", "Calle 1");
    fd.set("nago_commune", "Ñuñoa");
    fd.set("nago_school", "");
    fd.set("nago_health_insurance", "fonasa");
    fd.set("nago_blood_type", "A+");
    fd.set("nago_has_allergies", "yes");
    fd.set("nago_allergies_detail", "Maní");
    fd.set("nago_has_condition", "no");
    fd.set("nago_health_center", "Posta");
    fd.set("nago_emergency_name", "Ana");
    fd.set("nago_emergency_relationship", "Madre");
    fd.set("nago_emergency_phone", "+56");
    fd.set("nago_protocol_version", "2026-08");
    fd.set("nago_signer_name", "Ana");
    fd.set("nago_signer_dni", "1-9");

    expect(readNagoExtrasFromFormData(fd)).toMatchObject({
      pack: "nago",
      schemaVersion: 1,
      nationality: "Chilena",
      hasAllergies: true,
      allergiesDetail: "Maní",
      hasMedicalCondition: false,
      protocol: { version: "2026-08", acceptedAt: "pending", signerName: "Ana" },
    });
  });
});
