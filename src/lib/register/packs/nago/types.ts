import type { NAGO_EXTRAS_SCHEMA_VERSION, NAGO_PROTOCOL_VERSION } from "@/lib/register/packs/nago/protocolVersion";

export type NagoBloodType = "O+" | "O-" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "unknown";

export type NagoHealthInsurance = "fonasa" | "isapre" | "other";

export interface NagoTenantExtras {
  pack: "nago";
  schemaVersion: typeof NAGO_EXTRAS_SCHEMA_VERSION;
  nationality: string;
  address: string;
  commune: string;
  school: string;
  healthInsurance: NagoHealthInsurance;
  healthInsuranceOther: string;
  bloodType: NagoBloodType;
  hasAllergies: boolean;
  allergiesDetail: string;
  hasMedicalCondition: boolean;
  medicalConditionDetail: string;
  preferredHealthCenter: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  protocol: {
    version: typeof NAGO_PROTOCOL_VERSION;
    acceptedAt: string;
    signerName: string;
    signerDni: string;
  };
}

export interface NagoCareNoteLabels {
  insurance: string;
  bloodType: string;
  condition: string;
  healthCenter: string;
  allergies: string;
  none: string;
}
