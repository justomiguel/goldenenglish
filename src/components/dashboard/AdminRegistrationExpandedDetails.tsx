"use client";

import { formatCivilIsoDateForDisplay } from "@/lib/calendar/civilGregorianDate";
import type { Dictionary } from "@/types/i18n";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import { AdminRegistrationNagoExtras } from "@/components/dashboard/AdminRegistrationNagoExtras";
import { AdminRegistrationIntakeActions } from "@/components/dashboard/AdminRegistrationIntakeActions";
import type { CurrentCohortSection } from "@/lib/academics/currentCohort";

type RegLabels = Dictionary["admin"]["registrations"];

export interface AdminRegistrationExpandedDetailsProps {
  row: AdminRegistrationRow;
  /** Must match the table's column count so the panel spans the full width. */
  colSpan: number;
  locale: string;
  labels: RegLabels;
  sectionName: string | null;
  requestedSectionNames?: string[];
  currentCohortSections?: CurrentCohortSection[];
  busy?: boolean;
  onBusy?: (id: string | null) => void;
  onIntakeDone?: () => void;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {label}
      </dt>
      <dd className="break-words">{value}</dd>
    </div>
  );
}

export function AdminRegistrationExpandedDetails({
  row,
  colSpan,
  locale,
  labels,
  sectionName,
  requestedSectionNames = [],
  currentCohortSections,
  busy,
  onBusy,
  onIntakeDone,
}: AdminRegistrationExpandedDetailsProps) {
  const empty = labels.emptyValue;
  const birth =
    formatCivilIsoDateForDisplay(locale, row.birth_date, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }) ?? empty;
  const contactedOn = row.contacted_at
    ? labels.contactedOn.replaceAll("{date}", new Date(row.contacted_at).toLocaleString(locale))
    : null;

  return (
    <tr className="border-t border-[var(--color-border)] bg-[var(--color-muted)]/30">
      <td colSpan={colSpan} className="px-3 py-3">
        <p className="mb-2 text-sm font-semibold text-[var(--color-secondary)]">
          {labels.detailsTitle}
        </p>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <Field label={labels.email} value={row.email || empty} />
          <Field label={labels.birthDate} value={birth} />
          <Field
            label={labels.preferredSection}
            value={
              requestedSectionNames.length > 0
                ? requestedSectionNames.join(" · ")
                : (sectionName ?? empty)
            }
          />
          <Field label={labels.tutorOnRequestName} value={row.tutor_name ?? empty} />
          <Field
            label={labels.tutorOnRequestRelationship}
            value={row.tutor_relationship ?? empty}
          />
          <Field label={labels.tutorOnRequestDni} value={row.tutor_dni ?? empty} />
          <Field label={labels.editTutorPhone} value={row.tutor_phone ?? empty} />
          <Field label={labels.tutorOnRequestEmail} value={row.tutor_email ?? empty} />
        </dl>
        {contactedOn ? (
          <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">{contactedOn}</p>
        ) : null}
        <AdminRegistrationNagoExtras
          tenantExtras={row.tenantExtras}
          locale={locale}
          labels={labels}
        />
        {onBusy && onIntakeDone ? (
          <AdminRegistrationIntakeActions
            locale={locale}
            row={row}
            labels={labels.intake}
            sections={currentCohortSections ?? []}
            busy={busy === true}
            onBusy={onBusy}
            onDone={onIntakeDone}
          />
        ) : null}
      </td>
    </tr>
  );
}
