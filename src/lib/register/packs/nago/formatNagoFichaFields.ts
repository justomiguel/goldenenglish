import type { NagoCareNoteLabels, NagoTenantExtras } from "@/lib/register/packs/nago/types";

export function formatNagoHomeAddress(extras: NagoTenantExtras): string {
  return `${extras.address}, ${extras.commune}`;
}

export function formatNagoCareHealthNote(
  extras: NagoTenantExtras,
  labels: NagoCareNoteLabels,
): string {
  const insurance =
    extras.healthInsurance === "other" && extras.healthInsuranceOther
      ? extras.healthInsuranceOther
      : extras.healthInsurance;
  const condition = extras.hasMedicalCondition
    ? extras.medicalConditionDetail
    : labels.none;
  return [
    `${labels.insurance}: ${insurance}`,
    `${labels.bloodType}: ${extras.bloodType}`,
    `${labels.condition}: ${condition}`,
    `${labels.healthCenter}: ${extras.preferredHealthCenter}`,
  ].join("\n");
}

export function formatNagoCareDietNote(
  extras: NagoTenantExtras,
  labels: NagoCareNoteLabels,
): string {
  const allergies = extras.hasAllergies ? extras.allergiesDetail : labels.none;
  return `${labels.allergies}: ${allergies}`;
}
