import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import type { EventAttendeeRow } from "@/lib/dashboard/events/loadEventAttendeesPaginated";
import type { EventAttendeeCustomFieldValuesMap } from "@/lib/dashboard/events/loadEventAttendeeCustomFieldValues";
import { shouldRenderEventFieldAsImage } from "@/lib/events/eventUploadPathDisplay";
import type {
  EventAttendeesExportCell,
  EventAttendeesExportColumnLabels,
  EventAttendeesExportCustomColumn,
  EventAttendeesExportTable,
} from "@/lib/events/export/eventAttendeesExportTypes";

function formatDateTime(value: string, locale: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(locale);
}

function formatBirthDate(value: string, locale: string): string {
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(locale);
}

function formatPayment(row: EventAttendeeRow, locale: string, labels: EventAttendeesExportColumnLabels): string {
  if (!row.payment) return labels.noPayment;
  const amount = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: row.payment.currency,
    maximumFractionDigits: 2,
  }).format(row.payment.amount);
  const status = labels.paymentLabels[row.payment.status] ?? row.payment.status;
  return `${amount} · ${status}`;
}

function textCell(text: string): EventAttendeesExportCell {
  return { text };
}

function buildFixedHeaders(labels: EventAttendeesExportColumnLabels): string[] {
  return [
    labels.name,
    labels.dni,
    labels.email,
    labels.phone,
    labels.birthDate,
    labels.status,
    labels.payment,
    labels.residency,
    labels.source,
    labels.registered,
    labels.tutorName,
    labels.tutorDni,
    labels.tutorEmail,
    labels.tutorPhone,
    labels.tutorRelationship,
  ];
}

function buildFixedRow(
  row: EventAttendeeRow,
  locale: string,
  labels: EventAttendeesExportColumnLabels,
): EventAttendeesExportCell[] {
  const tutor = row.tutor;
  return [
    textCell(formatProfileNameSurnameFirst(row.firstName, row.lastName)),
    textCell(row.dniOrPassport),
    textCell(row.email),
    textCell(row.phone?.trim() ? row.phone : labels.noPhone),
    textCell(row.birthDate ? formatBirthDate(row.birthDate, locale) : labels.noBirthDate),
    textCell(labels.statusLabels[row.status] ?? row.status),
    textCell(formatPayment(row, locale, labels)),
    textCell(row.isLocalResident ? labels.residencyLabels.local : labels.residencyLabels.nonLocal),
    textCell(labels.sourceLabels[row.source] ?? row.source),
    textCell(formatDateTime(row.createdAt, locale)),
    textCell(tutor ? formatProfileNameSurnameFirst(tutor.firstName, tutor.lastName) : labels.emptyValue),
    textCell(tutor?.dniOrPassport?.trim() ? tutor.dniOrPassport : labels.emptyValue),
    textCell(tutor?.email?.trim() ? tutor.email : labels.emptyValue),
    textCell(tutor?.phone?.trim() ? tutor.phone : labels.emptyValue),
    textCell(tutor?.relationship?.trim() ? tutor.relationship : labels.emptyValue),
  ];
}

export function buildEventAttendeesExportTable(input: {
  attendees: EventAttendeeRow[];
  customColumns: EventAttendeesExportCustomColumn[];
  customFieldValues: EventAttendeeCustomFieldValuesMap;
  locale: string;
  labels: EventAttendeesExportColumnLabels;
}): EventAttendeesExportTable {
  const headers = [...buildFixedHeaders(input.labels), ...input.customColumns.map((col) => col.label)];

  const rows = input.attendees.map((attendee) => {
    const fixed = buildFixedRow(attendee, input.locale, input.labels);
    const customByKey = new Map(
      (input.customFieldValues[attendee.id] ?? []).map((field) => [field.fieldKey, field]),
    );
    const customCells = input.customColumns.map((col): EventAttendeesExportCell => {
      const field = customByKey.get(col.fieldKey);
      if (!field?.displayValue.trim()) return textCell(input.labels.emptyValue);
      const path = field.fileStoragePath?.trim();
      if (path && shouldRenderEventFieldAsImage(field.fieldType, path)) {
        return { text: field.displayValue, imagePath: path };
      }
      return textCell(field.displayValue);
    });
    return [...fixed, ...customCells];
  });

  return { headers, rows };
}
