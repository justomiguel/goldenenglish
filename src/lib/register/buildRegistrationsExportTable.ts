import { formatCivilIsoDateForDisplay } from "@/lib/calendar/civilGregorianDate";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { formatRegistrationLevelInterestDisplay } from "@/lib/register/formatRegistrationLevelInterestDisplay";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { Dictionary } from "@/types/i18n";

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
  opts: { locale: string },
): RegistrationsExportTable {
  const empty = labels.emptyValue;
  const text = (value: string | null | undefined) => {
    const trimmed = (value ?? "").trim();
    return trimmed || empty;
  };

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
    ],
    rows: rows.map((r) => [
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
    ]),
  };
}
