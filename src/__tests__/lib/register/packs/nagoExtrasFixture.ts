import type { NagoTenantExtras } from "@/lib/register/packs/nago/types";

export function validNagoExtras(over: Partial<NagoTenantExtras> = {}): NagoTenantExtras {
  return {
    pack: "nago",
    schemaVersion: 1,
    nationality: "Chilena",
    address: "Av. Principal 100",
    commune: "Santiago",
    school: "Colegio Sur",
    healthInsurance: "fonasa",
    healthInsuranceOther: "",
    bloodType: "O+",
    hasAllergies: false,
    allergiesDetail: "",
    hasMedicalCondition: false,
    medicalConditionDetail: "",
    preferredHealthCenter: "Hospital Sótero del Río",
    emergencyName: "Ana Pérez",
    emergencyRelationship: "Madre",
    emergencyPhone: "+56911111111",
    protocol: {
      version: "2026-08",
      acceptedAt: "2026-08-25T12:00:00.000Z",
      signerName: "Ana Pérez",
      signerDni: "11111111-1",
    },
    ...over,
  };
}
