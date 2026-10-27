"use client";

import {
  CalendarClock,
  CreditCard,
  ExternalLink,
  IdCard,
  Landmark,
  Mail,
  Phone,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AdminEventAttendeePresentationBadge } from "@/components/dashboard/admin/events/AdminEventAttendeePresentationBadge";
import { EventSelectedSeatsMiniMap } from "@/components/dashboard/admin/events/EventSelectedSeatsMiniMap";
import { resolveAttendeePaymentStatusTone } from "@/lib/events/resolveAttendeePresentation";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import type { EventPaymentRow } from "@/lib/dashboard/events/loadEventPaymentsPaginated";
import type { EventSeatMapConfig } from "@/lib/events/seatMapModel";
import {
  AdminEventPaymentReviewActions,
  type AdminEventPaymentReviewActionsLabels,
} from "@/components/dashboard/admin/events/AdminEventPaymentReviewActions";

export interface AdminEventPaymentReviewRowLabels extends AdminEventPaymentReviewActionsLabels {
  amount: string;
  dni: string;
  email: string;
  phone: string;
  method: string;
  registered: string;
  receipt: string;
  noReceipt: string;
  noPhone: string;
  reviewNotes: string;
  paidAt: string;
  receiptOpenTooltip: string;
  statusLabels: Record<string, string>;
  methodLabels: Record<string, string>;
  transferSource?: string;
  transferAnswer?: string;
  seatLabels?: string;
  minorTickets?: string;
}

interface AdminEventPaymentReviewRowProps {
  locale: string;
  eventId: string;
  row: EventPaymentRow;
  receiptPreviewUrl: string | null;
  seatMapConfig?: EventSeatMapConfig | null;
  labels: AdminEventPaymentReviewRowLabels;
}

function Fact({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]">
        {label}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[var(--color-foreground)]">
        <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted-foreground)]" aria-hidden />
        <span className="truncate">{value}</span>
      </p>
    </div>
  );
}

function formatDateTime(value: string, locale: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(locale);
}

export function AdminEventPaymentReviewRow({
  locale,
  eventId,
  row,
  receiptPreviewUrl,
  seatMapConfig = null,
  labels,
}: AdminEventPaymentReviewRowProps) {
  const attendeeName = formatProfileNameSurnameFirst(row.attendee.firstName, row.attendee.lastName);
  const amountLabel = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: row.currency,
    maximumFractionDigits: 2,
  }).format(row.amount);
  const methodKey = row.gatewayProvider ?? "bank_transfer";
  const methodLabel = labels.methodLabels[methodKey] ?? methodKey;
  const statusLabel = labels.statusLabels[row.status] ?? row.status;
  const isPending = row.status === "pending";
  const isPdf = receiptPreviewUrl ? /\.pdf($|\?)/i.test(receiptPreviewUrl) : false;

  return (
    <li className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-[var(--color-foreground)]">{attendeeName}</p>
          <div className="mt-2">
            <AdminEventAttendeePresentationBadge
              label={statusLabel}
              tone={resolveAttendeePaymentStatusTone(row.status)}
            />
          </div>
        </div>
        <p className="text-2xl font-semibold tracking-tight text-[var(--color-foreground)]">{amountLabel}</p>
      </div>
      <div className="grid gap-4 px-4 py-4 sm:grid-cols-3">
        <Fact
          icon={row.gatewayProvider ? CreditCard : Landmark}
          label={labels.method}
          value={methodLabel}
        />
        <Fact icon={IdCard} label={labels.dni} value={row.attendee.dniOrPassport} />
        <Fact icon={CalendarClock} label={labels.registered} value={formatDateTime(row.createdAt, locale)} />
        {row.attendee.transferSourceLabel && labels.transferSource ? (
          <Fact icon={Landmark} label={labels.transferSource} value={row.attendee.transferSourceLabel} />
        ) : null}
        {row.attendee.transferQuestionAnswer && labels.transferAnswer ? (
          <Fact icon={Landmark} label={labels.transferAnswer} value={row.attendee.transferQuestionAnswer} />
        ) : null}
        {row.attendee.minorTicketCount && labels.minorTickets ? (
          <Fact icon={Users} label={labels.minorTickets} value={String(row.attendee.minorTicketCount)} />
        ) : null}
      </div>
      {row.attendee.seatLabels && row.attendee.seatLabels.length > 0 && labels.seatLabels ? (
        <div className="border-t border-[var(--color-border)] px-4 py-4">
          <EventSelectedSeatsMiniMap
            config={seatMapConfig ?? null}
            seatLabels={row.attendee.seatLabels}
            label={labels.seatLabels}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-4 px-4 text-sm">
        <a
          href={`mailto:${row.attendee.email}`}
          className="inline-flex items-center gap-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          <Mail className="h-3.5 w-3.5" aria-hidden />
          {row.attendee.email}
        </a>
        {row.attendee.phone?.trim() ? (
          <a
            href={`tel:${row.attendee.phone}`}
            className="inline-flex items-center gap-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            <Phone className="h-3.5 w-3.5" aria-hidden />
            {row.attendee.phone}
          </a>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 px-4 pb-4 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,18rem)]">
        <div className="space-y-3">
          {!isPending && row.reviewNotes?.trim() ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {labels.reviewNotes}: {row.reviewNotes}
            </p>
          ) : null}
          {!isPending && row.paidAt ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {labels.paidAt}: {formatDateTime(row.paidAt, locale)}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            {receiptPreviewUrl && !isPdf ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={receiptPreviewUrl}
                alt=""
                className="mb-3 max-h-36 w-full rounded-md object-contain ring-1 ring-[var(--color-border)]"
              />
            ) : null}
            {receiptPreviewUrl ? (
              <a
                href={receiptPreviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={labels.receiptOpenTooltip}
                aria-label={labels.receiptOpenTooltip}
                className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-sm font-medium text-[var(--color-primary-dark)] transition-colors hover:border-[color-mix(in_srgb,var(--color-primary)_35%,var(--color-border))] hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-surface))]"
              >
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                {labels.receipt}
              </a>
            ) : (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {labels.receipt}: {labels.noReceipt}
              </p>
            )}
          </div>
          <AdminEventPaymentReviewActions
            locale={locale}
            eventId={eventId}
            paymentId={row.id}
            status={row.status}
            gatewayProvider={row.gatewayProvider}
            initialNotes={row.reviewNotes ?? ""}
            labels={labels}
          />
        </div>
      </div>
    </li>
  );
}
