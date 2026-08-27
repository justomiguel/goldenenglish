import { NAGO_EXTRAS_SCHEMA_VERSION, NAGO_PROTOCOL_VERSION } from "@/lib/register/packs/nago/protocolVersion";

function text(fd: FormData, name: string): string {
  return String(fd.get(name) ?? "").trim();
}

function yesNo(fd: FormData, name: string): boolean {
  return text(fd, name) === "yes";
}

export function readNagoExtrasFromFormData(fd: FormData): unknown {
  return {
    pack: "nago",
    schemaVersion: NAGO_EXTRAS_SCHEMA_VERSION,
    nationality: text(fd, "nago_nationality"),
    address: text(fd, "nago_address"),
    commune: text(fd, "nago_commune"),
    school: text(fd, "nago_school"),
    healthInsurance: text(fd, "nago_health_insurance"),
    healthInsuranceOther: text(fd, "nago_health_insurance_other"),
    bloodType: text(fd, "nago_blood_type") || "unknown",
    hasAllergies: yesNo(fd, "nago_has_allergies"),
    allergiesDetail: text(fd, "nago_allergies_detail"),
    hasMedicalCondition: yesNo(fd, "nago_has_condition"),
    medicalConditionDetail: text(fd, "nago_condition_detail"),
    preferredHealthCenter: text(fd, "nago_health_center"),
    emergencyName: text(fd, "nago_emergency_name"),
    emergencyRelationship: text(fd, "nago_emergency_relationship"),
    emergencyPhone: text(fd, "nago_emergency_phone"),
    protocol: {
      version: text(fd, "nago_protocol_version") || NAGO_PROTOCOL_VERSION,
      acceptedAt: "pending",
      signerName: text(fd, "nago_signer_name"),
      signerDni: text(fd, "nago_signer_dni"),
    },
  };
}
