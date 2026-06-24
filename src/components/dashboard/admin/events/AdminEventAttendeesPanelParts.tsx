import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import type {
  EventAttendeePaymentSummary,
  EventAttendeeRow,
} from "@/lib/dashboard/events/loadEventAttendeesPaginated";
import type { EventAttendeeCustomFieldValue } from "@/lib/dashboard/events/loadEventAttendeeCustomFieldValues";

export interface AdminEventAttendeesPanelLabels {
  title: string;
  empty: string;
  searchPlaceholder: string;
  searchButton: string;
  expandRow: string;
  collapseRow: string;
  moreDetails: string;
  columns: {
    name: string;
    dni: string;
    email: string;
    phone: string;
    birthDate: string;
    status: string;
    payment: string;
    registered: string;
    source: string;
    residency: string;
    actions: string;
  };
  statusLabels: Record<string, string>;
  paymentLabels: Record<string, string>;
  residencyLabels: {
    local: string;
    nonLocal: string;
  };
  sourceLabels: Record<string, string>;
  tutorSectionTitle: string;
  customFieldsTitle: string;
  noPhone: string;
  noBirthDate: string;
  noPayment: string;
  pagination: {
    prev: string;
    next: string;
    summary: string;
    pageOf: string;
    navAria: string;
  };
  export: {
    downloadXlsx: string;
    downloadPdf: string;
    tipXlsx: string;
    tipPdf: string;
    exportError: string;
  };
  delete: {
    delete: string;
    deleteTooltip: string;
    deleteConfirmTitle: string;
    deleteConfirmBody: string;
    deleteConfirm: string;
    cancel: string;
    errorDelete: string;
    errorNotDeletable: string;
  };
}

export function formatAttendeeDate(value: string, locale: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(locale);
}

export function formatAttendeeBirthDate(value: string, locale: string): string {
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(locale);
}

export function formatAttendeeValue(value: string | null | undefined): string {
  return value?.trim() ? value.trim() : "—";
}

export function formatAttendeeStatus(status: string, labels: AdminEventAttendeesPanelLabels): string {
  return labels.statusLabels[status] ?? status;
}

export function formatAttendeePaymentStatus(
  payment: EventAttendeePaymentSummary | null,
  locale: string,
  labels: AdminEventAttendeesPanelLabels,
): string {
  if (!payment) return labels.noPayment;
  const amount = formatAttendeePaymentAmount(payment, locale);
  const status = labels.paymentLabels[payment.status] ?? payment.status;
  return `${amount} · ${status}`;
}

export function formatAttendeePaymentAmount(
  payment: EventAttendeePaymentSummary,
  locale: string,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: payment.currency,
    maximumFractionDigits: 2,
  }).format(payment.amount);
}

export function formatAttendeePaymentStatusLabel(
  payment: EventAttendeePaymentSummary | null,
  labels: AdminEventAttendeesPanelLabels,
): string | null {
  if (!payment) return null;
  return labels.paymentLabels[payment.status] ?? payment.status;
}

export function formatAttendeeResidency(
  isLocalResident: boolean,
  labels: AdminEventAttendeesPanelLabels,
): string {
  return isLocalResident ? labels.residencyLabels.local : labels.residencyLabels.nonLocal;
}

export function formatAttendeeSource(source: string, labels: AdminEventAttendeesPanelLabels): string {
  return labels.sourceLabels[source] ?? source;
}

export function formatAttendeeTutor(
  tutor: NonNullable<EventAttendeeRow["tutor"]>,
  labels: AdminEventAttendeesPanelLabels,
): string {
  const name = formatProfileNameSurnameFirst(tutor.firstName, tutor.lastName);
  const phone = tutor.phone?.trim() ? tutor.phone : labels.noPhone;
  return `${name} · ${phone}`;
}

export function formatAttendeeCustomFieldValue(field: EventAttendeeCustomFieldValue): string {
  return field.displayValue.trim() || "—";
}

export function formatAttendeeDisplayName(row: EventAttendeeRow): string {
  return formatProfileNameSurnameFirst(row.firstName, row.lastName);
}

export function AttendeeDetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-[var(--color-foreground)]">{value}</dd>
    </div>
  );
}
