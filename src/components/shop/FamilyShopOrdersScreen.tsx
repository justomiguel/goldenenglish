"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { assignParentShopOrder } from "@/app/[locale]/dashboard/parent/shop/orders/actions";
import { FamilyShopNav } from "@/components/shop/FamilyShopNav";
import { formatShopMoney } from "@/lib/shop/formatShopMoney";
import { isAssignableShopOrderStatus } from "@/lib/shop/shopOrderStatus";
import type { FamilyShopOrderRow, ShopAssignOption } from "@/lib/shop/loadFamilyShopOrders";
import type { Dictionary } from "@/types/i18n";

type FamilyLabels = Dictionary["shop"]["family"];
type OrderLabels = Dictionary["shop"]["order"];

export function FamilyShopOrdersScreen({
  locale,
  role,
  rows,
  assignOptions,
  family,
  order,
}: {
  locale: string;
  role: "parent" | "student";
  rows: FamilyShopOrderRow[];
  assignOptions: ShopAssignOption[];
  family: FamilyLabels;
  order: OrderLabels;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold text-[var(--color-foreground)]">
          {family.ordersTitle}
        </h1>
        <p className="text-[var(--color-muted-foreground)]">
          {role === "student" ? family.studentLead : family.ordersLead}
        </p>
        {role === "parent" ? <FamilyShopNav locale={locale} labels={family} current="orders" /> : null}
      </header>
      {msg ? <p className="text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}
      {rows.length === 0 ? (
        <p role="status">{family.empty}</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((row) => (
            <li
              key={row.id}
              className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)]"
            >
              <p className="text-sm font-semibold text-[var(--color-primary)]">
                {order.status[row.status]}
              </p>
              <p className="text-sm text-[var(--color-muted-foreground)]">{order.pickup}</p>
              <ul className="space-y-2">
                {row.items.map((item) => (
                  <li key={`${row.id}-${item.title}-${item.size}-${item.color}`} className="text-sm">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-[var(--color-muted-foreground)]">
                      {item.size} · {item.color} · {order.quantity} {item.quantity}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="text-sm font-semibold">
                {order.total}: {formatShopMoney(row.total, row.currency, locale)}
              </p>
              {role === "parent" && isAssignableShopOrderStatus(row.status) ? (
                <AssignForm
                  locale={locale}
                  orderId={row.id}
                  currentId={row.assigneeStudentId}
                  options={assignOptions}
                  family={family}
                  busy={busy}
                  onBusy={setBusy}
                  onMessage={setMsg}
                  onDone={() => router.refresh()}
                />
              ) : row.assigneeName ? (
                <p className="text-sm">
                  {family.assignLabel}: {row.assigneeName}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function AssignForm({
  locale,
  orderId,
  currentId,
  options,
  family,
  busy,
  onBusy,
  onMessage,
  onDone,
}: {
  locale: string;
  orderId: string;
  currentId: string | null;
  options: ShopAssignOption[];
  family: FamilyLabels;
  busy: boolean;
  onBusy: (value: boolean) => void;
  onMessage: (value: string | null) => void;
  onDone: () => void;
}) {
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const studentId = String(new FormData(e.currentTarget).get("studentId") ?? "") || null;
        onBusy(true);
        onMessage(null);
        void assignParentShopOrder({ locale, orderId, studentId }).then((res) => {
          onBusy(false);
          if (res.ok) onDone();
          else onMessage(family.assignError);
        });
      }}
    >
      <label className="text-sm">
        {family.assignLabel}
        <select
          name="studentId"
          defaultValue={currentId ?? ""}
          className="mt-1 block rounded-md border border-[var(--color-border)] px-2 py-1"
        >
          <option value="">{family.assignNone}</option>
          {options.map((child) => (
            <option key={child.id} value={child.id}>
              {child.label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={busy} className="text-sm font-semibold text-[var(--color-primary)]">
        {family.assignSubmit}
      </button>
    </form>
  );
}
