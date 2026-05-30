import type { ReactNode } from "react";
import Link from "next/link";
import {
  CalendarClock,
  Cake,
  ClipboardList,
  Globe,
  Mail,
  MapPin,
  Phone,
  Users,
  Wallet,
} from "lucide-react";
import {
  AdminEventAttendeePresentationBadge,
} from "@/components/dashboard/admin/events/AdminEventAttendeePresentationBadge";
import {
  formatAttendeeBirthDate,
  formatAttendeeCustomFieldValue,
  formatAttendeeDate,
  formatAttendeePaymentAmount,
  formatAttendeePaymentStatusLabel,
  formatAttendeeResidency,
  formatAttendeeSource,
  formatAttendeeTutor,
  formatAttendeeValue,
  type AdminEventAttendeesPanelLabels,
} from "@/components/dashboard/admin/events/AdminEventAttendeesPanelParts";
import { resolveAttendeePaymentStatusTone } from "@/lib/events/resolveAttendeePresentation";
import type { EventAttendeeCustomFieldValue } from "@/lib/dashboard/events/loadEventAttendeeCustomFieldValues";
import type { EventAttendeeRow } from "@/lib/dashboard/events/loadEventAttendeesPaginated";

interface AdminEventAttendeeExpandedDetailsProps {
  row: EventAttendeeRow;
  customFields: EventAttendeeCustomFieldValue[];
  locale: string;
  labels: AdminEventAttendeesPanelLabels;
}

export function AdminEventAttendeeExpandedDetails({
  row,
  customFields,
  locale,
  labels,
}: AdminEventAttendeeExpandedDetailsProps) {
  const paymentStatusLabel = formatAttendeePaymentStatusLabel(row.payment, labels);

  return (
    <div className="border-t border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-surface))] px-4 py-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AttendeeDetailCard
          icon={CalendarClock}
          label={labels.columns.registered}
          value={formatAttendeeDate(row.createdAt, locale)}
        />
        <AttendeeDetailCard
          icon={MapPin}
          label={labels.columns.residency}
          value={formatAttendeeResidency(row.isLocalResident, labels)}
        />
        <AttendeeDetailCard
          icon={Globe}
          label={labels.columns.source}
          value={formatAttendeeSource(row.source, labels)}
        />
        {row.birthDate ? (
          <AttendeeDetailCard
            icon={Cake}
            label={labels.columns.birthDate}
            value={formatAttendeeBirthDate(row.birthDate, locale)}
          />
        ) : null}
        <AttendeeDetailCard
          icon={Mail}
          label={labels.columns.email}
          value={formatAttendeeValue(row.email)}
          href={row.email ? `mailto:${row.email}` : undefined}
        />
        <AttendeeDetailCard
          icon={Phone}
          label={labels.columns.phone}
          value={formatAttendeeValue(row.phone ?? labels.noPhone)}
          href={row.phone?.trim() ? `tel:${row.phone}` : undefined}
        />
      </div>

      {row.tutor ? (
        <AttendeeDetailSection icon={Users} title={labels.tutorSectionTitle}>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AttendeeDetailStat label={labels.columns.name} value={formatAttendeeTutor(row.tutor, labels)} />
            <AttendeeDetailStat label={labels.columns.dni} value={formatAttendeeValue(row.tutor.dniOrPassport)} />
            <AttendeeDetailStat label={labels.columns.email} value={formatAttendeeValue(row.tutor.email)} />
            <AttendeeDetailStat
              label={labels.columns.phone}
              value={formatAttendeeValue(row.tutor.phone?.trim() ? row.tutor.phone : labels.noPhone)}
            />
          </dl>
        </AttendeeDetailSection>
      ) : null}

      {customFields.length > 0 ? (
        <AttendeeDetailSection icon={ClipboardList} title={labels.customFieldsTitle}>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {customFields.map((field) => (
              <AttendeeDetailStat
                key={field.fieldKey}
                label={field.label}
                value={formatAttendeeCustomFieldValue(field)}
              />
            ))}
          </dl>
        </AttendeeDetailSection>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]/80 px-4 py-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))] text-[var(--color-primary-dark)]">
          <Wallet className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]">
            {labels.columns.payment}
          </p>
          {row.payment && paymentStatusLabel ? (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-[var(--color-foreground)]">
                {formatAttendeePaymentAmount(row.payment, locale)}
              </p>
              <AdminEventAttendeePresentationBadge
                label={paymentStatusLabel}
                tone={resolveAttendeePaymentStatusTone(row.payment.status)}
              />
            </div>
          ) : (
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.noPayment}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function AttendeeDetailSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Users;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]/90">
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-muted)]/25 px-4 py-2.5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))] text-[var(--color-primary-dark)]">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <h4 className="text-sm font-semibold text-[var(--color-foreground)]">{title}</h4>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function AttendeeDetailCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]/90 p-3 shadow-sm">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))] text-[var(--color-primary-dark)]">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]">
          {label}
        </p>
        {href ? (
          <Link
            href={href}
            className="mt-1 block break-words text-sm font-medium text-[var(--color-foreground)] hover:text-[var(--color-primary-dark)] hover:underline"
          >
            {value}
          </Link>
        ) : (
          <p className="mt-1 break-words text-sm font-medium text-[var(--color-foreground)]">{value}</p>
        )}
      </div>
    </div>
  );
}

function AttendeeDetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-[var(--color-border)]/70 bg-[var(--color-surface)] px-3 py-2.5">
      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-[var(--color-foreground)]">{value}</dd>
    </div>
  );
}
