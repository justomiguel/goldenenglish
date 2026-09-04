"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";
import {
  assignAdminShopOrder,
  transitionAdminShopOrder,
} from "@/app/[locale]/dashboard/admin/merch/orders/actions";
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
            className={`rounded-full px-3 py-1 text-sm ${
              statusFilter === status
                ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                : "border border-[var(--color-border)]"
            }`}
          >
            {status === "all" ? labels.filterAll : statusLabels[status]}
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <p role="status">{labels.emptyOrders}</p>
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
                if (to === "cancelled" && !window.confirm(labels.cancelConfirm)) return;
                void run(() => transitionAdminShopOrder({ locale, orderId: row.id, to }));
              }}
              onAssign={(studentId) => {
                void run(() => assignAdminShopOrder({ locale, orderId: row.id, studentId }));
              }}
            />
          ))}
        </ul>
      )}
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
    <li className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
      <p className="text-sm font-semibold">{statusLabels[row.status]}</p>
      <p className="text-sm">
        {labels.colBuyer}: {row.buyerEmail}
      </p>
      <p className="text-sm">
        {labels.colTotal}: {row.total} {row.currency}
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
        <label className="text-sm">
          {labels.colAssignee}
          <select
            name="studentId"
            defaultValue={row.assigneeStudentId ?? ""}
            className="mt-1 block rounded-md border border-[var(--color-border)] px-2 py-1"
          >
            <option value="">{labels.assignNone}</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={busy} className="text-sm font-semibold text-[var(--color-primary)]">
          {labels.assignSubmit}
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        {row.status === "paid" ? (
          <button type="button" disabled={busy} onClick={() => onTransition("ready_for_pickup")}>
            {labels.markReady}
          </button>
        ) : null}
        {row.status === "ready_for_pickup" ? (
          <button type="button" disabled={busy} onClick={() => onTransition("picked_up")}>
            {labels.markPickedUp}
          </button>
        ) : null}
        {row.status === "pending_payment" || row.status === "paid" || row.status === "ready_for_pickup" ? (
          <button type="button" disabled={busy} onClick={() => onTransition("cancelled")}>
            {labels.markCancel}
          </button>
        ) : null}
      </div>
    </li>
  );
}
