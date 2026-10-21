"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Download, Plus, Sparkles, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import type { EventDiscountCodeListRow } from "@/lib/dashboard/events/loadEventDiscountCodes";
import {
  deleteEventDiscountCodeAction,
  generateEventDiscountCodesAction,
  importEventDiscountCodesAction,
  saveEventDiscountCodeAction,
} from "@/app/[locale]/dashboard/admin/events/eventDiscountCodeActions";
import type { AdminEventDiscountCodeLabels } from "@/components/dashboard/admin/events/adminEventDiscountCodeLabels";

interface AdminEventDiscountCodesPanelProps {
  locale: string;
  eventId: string;
  rows: EventDiscountCodeListRow[];
  usesTruncated?: boolean;
  labels: AdminEventDiscountCodeLabels;
}

const fieldClass =
  "min-h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)]";

function errorText(labels: AdminEventDiscountCodeLabels, code: string | undefined): string {
  if (!code) return labels.error;
  return labels.errors[code as keyof AdminEventDiscountCodeLabels["errors"]] ?? labels.error;
}

export function AdminEventDiscountCodesPanel({
  locale,
  eventId,
  rows,
  usesTruncated = false,
  labels,
}: AdminEventDiscountCodesPanelProps) {
  const router = useRouter();
  const [openCodeId, setOpenCodeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [uses, setUses] = useState("1");
  const [percent, setPercent] = useState("10");
  const [quantity, setQuantity] = useState("10");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [download, setDownload] = useState<string | null>(null);

  async function run(
    task: () => Promise<{
      ok: boolean;
      code?: string;
      downloadBase64?: string;
      errors?: { row: number; code: string }[];
    }>,
  ) {
    setPending(true);
    setMessage(null);
    const result = await task();
    setPending(false);
    if (!result.ok) {
      setMessage(errorText(labels, result.code));
      return;
    }
    if (result.downloadBase64) setDownload(result.downloadBase64);
    const rowErrors = (result.errors ?? []).map((error) => errorText(labels, error.code));
    setMessage(rowErrors.length > 0 ? rowErrors.join(" ") : labels.saved);
    router.refresh();
  }

  function downloadFile() {
    if (!download) return;
    const bytes = Uint8Array.from(atob(download), (char) => char.charCodeAt(0));
    const url = URL.createObjectURL(
      new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "discount-codes.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)]">
      <p className="text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>
      <div className="grid gap-3 md:grid-cols-4">
        <input aria-label={labels.code} className={fieldClass} value={code} onChange={(event) => setCode(event.target.value)} />
        <input aria-label={labels.uses} className={fieldClass} value={uses} onChange={(event) => setUses(event.target.value)} />
        <input aria-label={labels.percent} className={fieldClass} value={percent} onChange={(event) => setPercent(event.target.value)} />
        <Button type="button" disabled={pending} onClick={() => void run(() => saveEventDiscountCodeAction({ locale, eventId, code, uses, percent }))}>
          <Plus className="h-4 w-4" aria-hidden />
          {labels.add}
        </Button>
      </div>
      <p className="text-xs text-[var(--color-muted-foreground)]">{labels.usesHint}</p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 text-sm">
          <Upload className="h-4 w-4" aria-hidden />
          {labels.importFile}
          <input
            type="file"
            accept=".xlsx,.xls"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const base64 = String(reader.result ?? "").split(",")[1] ?? "";
                void run(() => importEventDiscountCodesAction({ locale, eventId, fileBase64: base64 }));
              };
              reader.readAsDataURL(file);
            }}
          />
        </label>
        <input aria-label={labels.quantity} className={`${fieldClass} max-w-28`} value={quantity} onChange={(event) => setQuantity(event.target.value)} />
        <Button type="button" variant="ghost" disabled={pending} onClick={() => void run(() => generateEventDiscountCodesAction({ locale, eventId, quantity: Number(quantity), uses, percent }))}>
          <Sparkles className="h-4 w-4" aria-hidden />
          {labels.generate}
        </Button>
        {download ? (
          <Button type="button" variant="ghost" onClick={downloadFile}>
            <Download className="h-4 w-4" aria-hidden />
            {labels.download}
          </Button>
        ) : null}
      </div>
      {message ? <p className="text-sm text-[var(--color-foreground)]">{message}</p> : null}
      {usesTruncated ? <p className="text-sm text-[var(--color-muted-foreground)]">{labels.usesCap}</p> : null}
      {rows.length === 0 ? <p className="text-sm text-[var(--color-muted-foreground)]">{labels.empty}</p> : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--color-muted-foreground)]">
              <th>{labels.columns.code}</th>
              <th>{labels.columns.percent}</th>
              <th>{labels.columns.uses}</th>
              <th>{labels.columns.reserved}</th>
              <th>{labels.columns.consumed}</th>
              <th>{labels.columns.person}</th>
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
                    <td>{row.discountPercent}</td>
                    <td>{row.maxUses == null ? labels.unlimited : row.maxUses}</td>
                    <td>{row.reserved}</td>
                    <td>{row.consumed}</td>
                    <td>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setOpenCodeId(open ? null : row.id)}
                      >
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
                              <tr className="text-left text-[var(--color-muted-foreground)]">
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
          void run(() => deleteEventDiscountCodeAction({ locale, eventId, codeId: deleteId })).then(() => setDeleteId(null));
        }}
      />
    </section>
  );
}
