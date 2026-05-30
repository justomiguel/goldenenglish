"use client";

import { ExternalLink, Mail, Phone } from "lucide-react";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import type { EventPaymentRow } from "@/lib/dashboard/events/loadEventPaymentsPaginated";
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
}

interface AdminEventPaymentReviewRowProps {
  locale: string;
  eventId: string;
  row: EventPaymentRow;
  receiptPreviewUrl: string | null;
  labels: AdminEventPaymentReviewRowLabels;
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
    <li className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-base font-semibold text-[var(--color-foreground)]">{attendeeName}</p>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {labels.amount}: {amountLabel} · {labels.method}: {methodLabel}
          </p>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {labels.dni}: {row.attendee.dniOrPassport} · {labels.email}: {row.attendee.email}
          </p>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {labels.phone}: {row.attendee.phone?.trim() ? row.attendee.phone : labels.noPhone}
          </p>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {labels.registered}: {formatDateTime(row.createdAt, locale)}
          </p>
        </div>
        <span className="rounded-full border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-muted-foreground)]">
          {statusLabel}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
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

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
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

        <div className="flex flex-col gap-2">
          {receiptPreviewUrl && !isPdf ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={receiptPreviewUrl}
              alt=""
              className="max-h-36 w-full rounded-md object-contain ring-1 ring-[var(--color-border)]"
            />
          ) : null}
          {receiptPreviewUrl ? (
            <a
              href={receiptPreviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={labels.receiptOpenTooltip}
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] underline"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              {labels.receipt}
            </a>
          ) : (
            <span className="text-sm text-[var(--color-muted-foreground)]">
              {labels.receipt}: {labels.noReceipt}
            </span>
          )}
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
