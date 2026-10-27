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
    <section className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)]">
      <p className="text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>
      <AdminEventDiscountCodeEditor locale={locale} eventId={eventId} labels={labels} />
      {message ? <p className="text-sm text-[var(--color-foreground)]">{message}</p> : null}
      {usesTruncated ? <p className="text-sm text-[var(--color-muted-foreground)]">{labels.usesCap}</p> : null}
      {rows.length === 0 ? <p className="text-sm text-[var(--color-muted-foreground)]">{labels.empty}</p> : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-sm font-medium text-[var(--color-foreground)]">
              <th className="pb-2">{labels.columns.code}</th>
              <th className="pb-2">{labels.columns.percent}</th>
              <th className="pb-2">{labels.columns.uses}</th>
              <th className="pb-2">{labels.columns.reserved}</th>
              <th className="pb-2">{labels.columns.consumed}</th>
              <th className="pb-2">{labels.columns.person}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const open = openCodeId === row.id;
              const people = row.uses ?? [];
              return (
                <Fragment key={row.id}>
                  <tr className="border-t border-[var(--color-border)]">
                    <td className="py-2">{row.code}</td>
                    <td>{discountCell(row, labels, currency, locale)}</td>
                    <td>{row.maxUses == null ? labels.unlimited : row.maxUses}</td>
                    <td>{row.reserved}</td>
                    <td>{row.consumed}</td>
                    <td>
                      <Button type="button" variant="ghost" onClick={() => setOpenCodeId(open ? null : row.id)}>
                        <ChevronDown className="h-4 w-4" aria-hidden />
                        {open ? labels.hideUses : labels.showUses}
                      </Button>
                    </td>
                    <td>
                      <Button type="button" variant="destructive" onClick={() => setDeleteId(row.id)} aria-label={labels.delete}>
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    </td>
                  </tr>
                  {open ? (
                    <tr className="border-t border-[var(--color-border)]">
                      <td colSpan={7} className="py-2">
                        {people.length === 0 ? (
                          <p className="text-sm text-[var(--color-muted-foreground)]">{labels.noUsesYet}</p>
                        ) : (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-sm font-medium text-[var(--color-foreground)]">
                                <th>{labels.columns.person}</th>
                                <th>{labels.columns.email}</th>
                                <th>{labels.columns.use}</th>
                                <th>{labels.columns.payment}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {people.map((use) => (
                                <tr key={use.id}>
                                  <td className="py-1">{use.attendeeName}</td>
                                  <td>{use.email}</td>
                                  <td>{labels.useStatus[use.useStatus]}</td>
                                  <td>{use.paymentStatus ? labels.paymentStatus[use.paymentStatus] : labels.paymentStatus.none}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      )}
      <ConfirmActionModal
        open={deleteId != null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
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
