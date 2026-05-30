"use client";

import type { KeyboardEvent } from "react";
import { ChevronDown, Wallet } from "lucide-react";
import { AdminEventAttendeeAvatar } from "@/components/dashboard/admin/events/AdminEventAttendeeAvatar";
import { AdminEventAttendeeDeleteButton } from "@/components/dashboard/admin/events/AdminEventAttendeeDeleteButton";
import { AdminEventAttendeeExpandedDetails } from "@/components/dashboard/admin/events/AdminEventAttendeeExpandedDetails";
import {
  AdminEventAttendeeNoPaymentBadge,
  AdminEventAttendeePresentationBadge,
} from "@/components/dashboard/admin/events/AdminEventAttendeePresentationBadge";
import {
  formatAttendeeDisplayName,
  formatAttendeePaymentAmount,
  formatAttendeePaymentStatusLabel,
  formatAttendeeStatus,
  formatAttendeeValue,
  type AdminEventAttendeesPanelLabels,
} from "@/components/dashboard/admin/events/AdminEventAttendeesPanelParts";
import {
  ADMIN_EVENT_ATTENDEES_TABLE_BODY_CELL,
  ADMIN_EVENT_ATTENDEES_TABLE_TEXT,
  ADMIN_EVENT_ATTENDEES_TABLE_TEXT_MONO,
  ADMIN_EVENT_ATTENDEES_TABLE_TEXT_PROMINENT,
} from "@/lib/dashboard/events/adminEventAttendeesTableClasses";
import type { EventAttendeeCustomFieldValue } from "@/lib/dashboard/events/loadEventAttendeeCustomFieldValues";
import type { EventAttendeeRow } from "@/lib/dashboard/events/loadEventAttendeesPaginated";
import {
  resolveAttendeePaymentStatusTone,
  resolveAttendeeRegistrationStatusTone,
} from "@/lib/events/resolveAttendeePresentation";

interface AdminEventAttendeeTableRowProps {
  row: EventAttendeeRow;
  customFields: EventAttendeeCustomFieldValue[];
  locale: string;
  eventId: string;
  labels: AdminEventAttendeesPanelLabels;
  expanded: boolean;
  deletable: boolean;
  onToggle: () => void;
}

export function AdminEventAttendeeTableRow({
  row,
  customFields,
  locale,
  eventId,
  labels,
  expanded,
  deletable,
  onToggle,
}: AdminEventAttendeeTableRowProps) {
  const expandLabel = expanded ? labels.collapseRow : labels.expandRow;
  const displayName = formatAttendeeDisplayName(row);
  const statusLabel = formatAttendeeStatus(row.status, labels);
  const paymentStatusLabel = formatAttendeePaymentStatusLabel(row.payment, labels);
  const paymentAmount = row.payment ? formatAttendeePaymentAmount(row.payment, locale) : null;

  function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggle();
    }
  }

  return (
    <>
      <tr
        className={`border-b border-[var(--color-border)] transition-colors last:border-b-0 ${
          expanded
            ? "bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-surface))]"
            : "bg-[var(--color-background)] hover:bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-surface))]"
        }`}
        onClick={onToggle}
        onKeyDown={handleRowKeyDown}
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`${expandLabel}: ${displayName}`}
      >
        <td className={`${ADMIN_EVENT_ATTENDEES_TABLE_BODY_CELL} w-12`}>
          <AdminEventAttendeeAvatar
            firstName={row.firstName}
            lastName={row.lastName}
            expanded={expanded}
            size="sm"
          />
        </td>
        <td className={ADMIN_EVENT_ATTENDEES_TABLE_BODY_CELL}>
          <span className={ADMIN_EVENT_ATTENDEES_TABLE_TEXT_PROMINENT} title={displayName}>
            {displayName}
          </span>
        </td>
        <td className={ADMIN_EVENT_ATTENDEES_TABLE_BODY_CELL}>
          <span
            className={ADMIN_EVENT_ATTENDEES_TABLE_TEXT_MONO}
            title={formatAttendeeValue(row.dniOrPassport)}
          >
            {formatAttendeeValue(row.dniOrPassport)}
          </span>
        </td>
        <td className={ADMIN_EVENT_ATTENDEES_TABLE_BODY_CELL}>
          <span className={ADMIN_EVENT_ATTENDEES_TABLE_TEXT} title={row.email}>
            {formatAttendeeValue(row.email)}
          </span>
        </td>
        <td className={ADMIN_EVENT_ATTENDEES_TABLE_BODY_CELL}>
          <span
            className={ADMIN_EVENT_ATTENDEES_TABLE_TEXT}
            title={formatAttendeeValue(row.phone ?? labels.noPhone)}
          >
            {formatAttendeeValue(row.phone ?? labels.noPhone)}
          </span>
        </td>
        <td className={ADMIN_EVENT_ATTENDEES_TABLE_BODY_CELL}>
          <AdminEventAttendeePresentationBadge
            label={statusLabel}
            tone={resolveAttendeeRegistrationStatusTone(row.status)}
          />
        </td>
        <td className={ADMIN_EVENT_ATTENDEES_TABLE_BODY_CELL}>
          {paymentAmount && paymentStatusLabel ? (
            <div className="flex min-w-0 flex-col gap-1">
              <span
                className="inline-flex min-w-0 items-center gap-1 text-sm font-semibold"
                title={paymentAmount}
              >
                <Wallet className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted-foreground)]" aria-hidden />
                <span className="truncate">{paymentAmount}</span>
              </span>
              <AdminEventAttendeePresentationBadge
                label={paymentStatusLabel}
                tone={resolveAttendeePaymentStatusTone(row.payment?.status)}
              />
            </div>
          ) : (
            <AdminEventAttendeeNoPaymentBadge label={labels.noPayment} />
          )}
        </td>
        <td
          className={`${ADMIN_EVENT_ATTENDEES_TABLE_BODY_CELL} w-[5.5rem] text-right`}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-end gap-1">
            <span
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted-foreground)] transition-transform duration-200 ${
                expanded ? "rotate-180 border-[var(--color-primary)]/30 text-[var(--color-primary-dark)]" : ""
              }`}
              aria-hidden
            >
              <ChevronDown className="h-4 w-4" />
            </span>
            {deletable ? (
              <AdminEventAttendeeDeleteButton
                locale={locale}
                eventId={eventId}
                attendeeId={row.id}
                labels={labels.delete}
                compact
              />
            ) : (
              <span className="inline-block h-9 w-9 shrink-0" aria-hidden />
            )}
          </div>
        </td>
      </tr>
      {expanded ? (
        <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)] last:border-b-0">
          <td colSpan={8} className="p-0">
            <AdminEventAttendeeExpandedDetails
              row={row}
              customFields={customFields}
              locale={locale}
              labels={labels}
            />
          </td>
        </tr>
      ) : null}
    </>
  );
}
