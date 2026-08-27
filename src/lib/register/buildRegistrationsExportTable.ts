import { formatCivilIsoDateForDisplay } from "@/lib/calendar/civilGregorianDate";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { formatRegistrationLevelInterestDisplay } from "@/lib/register/formatRegistrationLevelInterestDisplay";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { Dictionary } from "@/types/i18n";
import { extrasPackForTemplateKind } from "@/lib/register/packs/extrasPackForTemplateKind";
import { parseNagoTenantExtras } from "@/lib/register/packs/nago/parseNagoTenantExtras";

type RegLabels = Dictionary["admin"]["registrations"];

export interface RegistrationsExportTable {
  headers: string[];
  rows: string[][];
}

function statusText(labels: RegLabels, status: string): string {
  if (status === "new") return labels.new;
  if (status === "contacted") return labels.contacted;
  if (status === "enrolled") return labels.enrolled;
  // Legacy or unexpected values stay visible rather than turning into a blank cell.
  return status;
}

/**
 * Flattens the admin list into spreadsheet cells. Everything the screen shows,
 * including both phones and the guardian block, so an exported file is a
 * complete call sheet and not a teaser that sends staff back to the browser.
 */
export function buildRegistrationsExportTable(
  rows: AdminRegistrationRow[],
  labels: RegLabels,
  opts: { locale: string; activeTemplateKind?: string },
): RegistrationsExportTable {
  const empty = labels.emptyValue;
  const text = (value: string | null | undefined) => {
    const trimmed = (value ?? "").trim();
    return trimmed || empty;
  };

  const includeNago = extrasPackForTemplateKind(opts.activeTemplateKind ?? "classic") === "nago";
  const nagoHeaders = includeNago
    ? [
        labels.nagoNationality,
        labels.nagoAddress,
        labels.nagoCommune,
        labels.nagoSchool,
        labels.nagoInsurance,
        labels.nagoBloodType,
        labels.nagoAllergies,
        labels.nagoCondition,
        labels.nagoHealthCenter,
        labels.nagoEmergencyName,
        labels.nagoEmergencyRelationship,
        labels.nagoEmergencyPhone,
        labels.nagoProtocolVersion,
        labels.nagoSignerName,
        labels.nagoSignerDni,
        labels.nagoAcceptedAt,
      ]
    : [];

  return {
    headers: [
      labels.name,
      labels.dni,
      labels.email,
      labels.phoneStudent,
      labels.phoneTutor,
      labels.tutorOnRequestName,
      labels.tutorOnRequestRelationship,
      labels.tutorOnRequestDni,
      labels.tutorOnRequestEmail,
      labels.birthDate,
      labels.level,
      labels.status,
      labels.received,
      ...nagoHeaders,
    ],
    rows: rows.map((r) => {
      const extras = includeNago ? parseNagoTenantExtras(r.tenantExtras) : null;
      const nagoCells = includeNago
        ? [
            text(extras?.nationality),
            text(extras?.address),
            text(extras?.commune),
            text(extras?.school),
            text(
              extras?.healthInsurance === "other"
                ? extras.healthInsuranceOther
                : extras?.healthInsurance,
            ),
            text(extras?.bloodType),
            text(extras?.hasAllergies ? extras.allergiesDetail : extras?.allergiesDetail),
            text(extras?.hasMedicalCondition ? extras.medicalConditionDetail : ""),
            text(extras?.preferredHealthCenter),
            text(extras?.emergencyName),
            text(extras?.emergencyRelationship),
            text(extras?.emergencyPhone),
            text(extras?.protocol.version),
            text(extras?.protocol.signerName),
            text(extras?.protocol.signerDni),
            extras?.protocol.acceptedAt
              ? new Date(extras.protocol.acceptedAt).toLocaleString(opts.locale)
              : empty,
          ]
        : [];
      return [
        formatProfileNameSurnameFirst(r.first_name, r.last_name),
        text(r.dni),
        text(r.email),
        text(r.phone),
        text(r.tutor_phone),
        text(r.tutor_name),
        text(r.tutor_relationship),
        text(r.tutor_dni),
        text(r.tutor_email),
        formatCivilIsoDateForDisplay(opts.locale, r.birth_date, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }) ?? empty,
        formatRegistrationLevelInterestDisplay(labels, r.level_interest),
        statusText(labels, r.status),
        r.created_at ? new Date(r.created_at).toLocaleString(opts.locale) : empty,
        ...nagoCells,
      ];
    }),
  };
}
