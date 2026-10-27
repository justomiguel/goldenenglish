"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, PackageCheck, UserCheck, XCircle } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";
import {
  assignAdminShopOrder,
  transitionAdminShopOrder,
} from "@/app/[locale]/dashboard/admin/merch/orders/actions";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import type { AdminShopOrderRow } from "@/lib/shop/loadAdminShopOrders";
import type { AdminShopTransition } from "@/lib/shop/shopOrderActionShared";
import type { ShopOrderStatus } from "@/lib/shop/types";
import type { Dictionary } from "@/types/i18n";

const FILTERS: Array<ShopOrderStatus | "all"> = [
  "all",
  "pending_payment",
  "paid",
  "ready_for_pickup",
  "picked_up",
  "expired",
  "cancelled",
];

type Labels = Dictionary["admin"]["merch"];
type StatusLabels = Dictionary["shop"]["order"]["status"];

function errorText(code: string, labels: Labels): string {
  if (code === "illegal_status") return labels.errorIllegalStatus;
  if (code === "not_found") return labels.errorNotFound;
  if (code === "forbidden") return labels.errorForbidden;
  if (code === "invalid_input") return labels.errorAssign;
  return labels.genericActionError;
}

export function AdminMerchOrdersScreen({
  locale,
  statusFilter,
  rows,
  students,
  labels,
  statusLabels,
}: {
  locale: string;
  statusFilter: string;
  rows: AdminShopOrderRow[];
  students: Array<{ id: string; label: string }>;
  labels: Labels;
  statusLabels: StatusLabels;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const base = `/${locale}/dashboard/admin/merch`;

  async function run(task: () => Promise<{ ok: true } | { ok: false; code: string }>) {
    setBusy(true);
    setMsg(null);
    const res = await task();
    setBusy(false);
    if (res.ok) router.refresh();
    else setMsg(errorText(res.code, labels));
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title={labels.ordersTitle} lead={labels.ordersLead} iconId="merch" />
      <p>
        <Link href={base} className="text-sm font-semibold text-[var(--color-primary)]">
          {labels.catalogLink}
        </Link>
      </p>
      {msg ? <p className="text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}
      <nav className="flex flex-wrap gap-2" aria-label={labels.ordersTitle}>
        {FILTERS.map((status) => (
          <Link
            key={status}
            href={status === "all" ? `${base}/orders` : `${base}/orders?status=${status}`}
            className={`inline-flex min-h-[38px] items-center rounded-full px-3 py-1.5 text-xs font-medium sm:text-sm ${
              statusFilter === status
                ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                : "border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)]"
            }`}
          >
            {status === "all" ? labels.filterAll : statusLabels[status]}
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <p role="status" className="text-sm text-[var(--color-muted-foreground)]">{labels.emptyOrders}</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => (
            <AdminOrderCard
              key={row.id}
              row={row}
              students={students}
              labels={labels}
              statusLabels={statusLabels}
              busy={busy}
              onTransition={(to) => {
                if (to === "cancelled") {
                  setCancelOrderId(row.id);
                  return;
                }
                void run(() => transitionAdminShopOrder({ locale, orderId: row.id, to }));
              }}
              onAssign={(studentId) => {
                void run(() => assignAdminShopOrder({ locale, orderId: row.id, studentId }));
              }}
            />
          ))}
        </ul>
      )}
      <ConfirmActionModal
        open={cancelOrderId !== null}
        onOpenChange={(open) => {
          if (!open) setCancelOrderId(null);
        }}
        title={labels.markCancel}
        description={labels.cancelConfirm}
        cancelLabel={labels.modalCancel}
        confirmLabel={labels.markCancel}
        confirmVariant="destructive"
        busy={busy}
        onConfirm={() => {
          if (!cancelOrderId) return;
          void run(() =>
            transitionAdminShopOrder({ locale, orderId: cancelOrderId, to: "cancelled" }),
          ).then(() => setCancelOrderId(null));
        }}
      />
    </div>
  );
}

function AdminOrderCard({
  row,
  students,
  labels,
  statusLabels,
  busy,
  onTransition,
  onAssign,
}: {
  row: AdminShopOrderRow;
  students: Array<{ id: string; label: string }>;
  labels: Labels;
  statusLabels: StatusLabels;
  busy: boolean;
  onTransition: (to: AdminShopTransition) => void;
  onAssign: (studentId: string | null) => void;
}) {
  return (
    <li className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-[var(--color-muted)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-foreground)]">
          {statusLabels[row.status]}
        </span>
        <span className="text-sm font-semibold tabular-nums text-[var(--color-foreground)]">
          {labels.colTotal}: {row.total} {row.currency}
        </span>
      </div>
      <p className="break-all text-sm text-[var(--color-foreground)]">
        {labels.colBuyer}: {row.buyerEmail}
      </p>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {labels.colItems}: {row.items || "—"}
      </p>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const value = String(new FormData(e.currentTarget).get("studentId") ?? "");
          onAssign(value || null);
        }}
      >
        <label className="min-w-[12rem] flex-1 text-sm font-medium text-[var(--color-foreground)]">
          {labels.colAssignee}
          <select
            name="studentId"
            defaultValue={row.assigneeStudentId ?? ""}
            className="mt-1 block min-h-11 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          >
            <option value="">{labels.assignNone}</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="secondary" size="sm" disabled={busy}>
          <UserCheck className="h-4 w-4 shrink-0" aria-hidden />
          {labels.assignSubmit}
        </Button>
      </form>
      <div className="flex flex-wrap gap-2 border-t border-[var(--color-border)]/60 pt-3">
        {row.status === "paid" ? (
          <Button type="button" size="sm" disabled={busy} onClick={() => onTransition("ready_for_pickup")}>
            <PackageCheck className="h-4 w-4 shrink-0" aria-hidden />
            {labels.markReady}
          </Button>
        ) : null}
        {row.status === "ready_for_pickup" ? (
          <Button type="button" size="sm" disabled={busy} onClick={() => onTransition("picked_up")}>
            <Check className="h-4 w-4 shrink-0" aria-hidden />
            {labels.markPickedUp}
          </Button>
        ) : null}
        {row.status === "pending_payment" || row.status === "paid" || row.status === "ready_for_pickup" ? (
          <Button type="button" variant="destructive" size="sm" disabled={busy} onClick={() => onTransition("cancelled")}>
            <XCircle className="h-4 w-4 shrink-0" aria-hidden />
            {labels.markCancel}
          </Button>
        ) : null}
      </div>
    </li>
  );
}
