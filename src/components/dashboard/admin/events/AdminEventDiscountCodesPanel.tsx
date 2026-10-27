"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import { AdminEventDiscountCodeEditor } from "@/components/dashboard/admin/events/AdminEventDiscountCodeEditor";
import type { EventDiscountCodeListRow } from "@/lib/dashboard/events/loadEventDiscountCodes";
import { deleteEventDiscountCodeAction } from "@/app/[locale]/dashboard/admin/events/eventDiscountCodeActions";
import { formatEventFlowPriceLabel } from "@/lib/events/formatEventFlowPrice";
import type { AdminEventDiscountCodeLabels } from "@/components/dashboard/admin/events/adminEventDiscountCodeLabels";

interface AdminEventDiscountCodesPanelProps {
  locale: string;
  eventId: string;
  currency: string;
  rows: EventDiscountCodeListRow[];
  usesTruncated?: boolean;
  labels: AdminEventDiscountCodeLabels;
}

function errorText(labels: AdminEventDiscountCodeLabels, code: string | undefined): string {
  if (!code) return labels.error;
  return labels.errors[code as keyof AdminEventDiscountCodeLabels["errors"]] ?? labels.error;
}

function discountCell(
  row: EventDiscountCodeListRow,
  labels: AdminEventDiscountCodeLabels,
  currency: string,
  locale: string,
): string {
  if (row.kind === "amount" && row.discountAmount != null && row.ticketCount != null) {
    const amount = formatEventFlowPriceLabel({
      price: row.discountAmount,
      currency,
      locale,
      freeLabel: "0",
    });
    return labels.amountCell.replace("{{amount}}", amount).replace("{{count}}", String(row.ticketCount));
  }
  return row.discountPercent == null ? "" : `${row.discountPercent}%`;
}

export function AdminEventDiscountCodesPanel({
  locale,
  eventId,
  currency,
  rows,
  usesTruncated = false,
  labels,
}: AdminEventDiscountCodesPanelProps) {
  const router = useRouter();
  const [openCodeId, setOpenCodeId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 shadow-[var(--shadow-soft)] sm:p-4">
      <p className="text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>
      <AdminEventDiscountCodeEditor locale={locale} eventId={eventId} labels={labels} />
      {message ? <p className="text-sm text-[var(--color-foreground)]">{message}</p> : null}
      {usesTruncated ? <p className="text-sm text-[var(--color-muted-foreground)]">{labels.usesCap}</p> : null}
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]">
          <table className="ge-stack-cards w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                <th className="px-3 py-2">{labels.columns.code}</th>
                <th className="px-3 py-2">{labels.columns.percent}</th>
                <th className="px-3 py-2">{labels.columns.uses}</th>
                <th className="px-3 py-2">{labels.columns.reserved}</th>
                <th className="px-3 py-2">{labels.columns.consumed}</th>
                <th className="px-3 py-2">{labels.columns.person}</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const open = openCodeId === row.id;
                const people = row.uses ?? [];
                return (
                  <Fragment key={row.id}>
                    <tr className="border-t border-[var(--color-border)]">
                      <td className="px-3 py-2 font-mono text-xs font-semibold">{row.code}</td>
                      <td className="px-3 py-2">{discountCell(row, labels, currency, locale)}</td>
                      <td className="px-3 py-2">{row.maxUses == null ? labels.unlimited : row.maxUses}</td>
                      <td className="px-3 py-2 tabular-nums">{row.reserved}</td>
                      <td className="px-3 py-2 tabular-nums">{row.consumed}</td>
                      <td className="px-3 py-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setOpenCodeId(open ? null : row.id)}>
                          <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
                          {open ? labels.hideUses : labels.showUses}
                        </Button>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteId(row.id)} aria-label={labels.delete}>
                          <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                        </Button>
                      </td>
                    </tr>
                    {open ? (
                      <tr className="border-t border-[var(--color-border)] bg-[var(--color-muted)]/15">
                        <td colSpan={7} className="p-3">
                          {people.length === 0 ? (
                            <p className="text-sm text-[var(--color-muted-foreground)]">{labels.noUsesYet}</p>
                          ) : (
                            <ul className="space-y-2">
                              {people.map((use) => (
                                <li
                                  key={use.id}
                                  className="grid gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs sm:grid-cols-4 sm:items-center sm:gap-3 sm:text-sm"
                                >
                                  <span className="font-medium text-[var(--color-foreground)]">{use.attendeeName}</span>
                                  <span className="truncate text-[var(--color-muted-foreground)]">{use.email}</span>
                                  <span className="text-[var(--color-foreground)]">{labels.useStatus[use.useStatus]}</span>
                                  <span className="text-[var(--color-muted-foreground)]">
                                    {use.paymentStatus ? labels.paymentStatus[use.paymentStatus] : labels.paymentStatus.none}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmActionModal
        open={deleteId != null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title={labels.confirmTitle}
        body={labels.confirmBody}
        cancelLabel={labels.cancel}
        confirmLabel={labels.delete}
        confirmVariant="destructive"
        busy={pending}
        onConfirm={() => {
          if (!deleteId) return;
          setPending(true);
          void deleteEventDiscountCodeAction({ locale, eventId, codeId: deleteId }).then((result) => {
            setPending(false);
            setDeleteId(null);
            if (!result.ok) {
              setMessage(errorText(labels, result.code));
              return;
            }
            router.refresh();
          });
        }}
      />
    </section>
  );
}
