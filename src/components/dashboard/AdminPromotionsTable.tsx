"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  softDeletePromotion,
  togglePromotionActive,
} from "@/app/[locale]/dashboard/admin/promotions/actions";
import type { Dictionary } from "@/types/i18n";

export type AdminPromotionRow = {
  id: string;
  code: string;
  name: string;
  discount_type: string;
  discount_value: number;
  applies_to: string;
  uses_count: number;
  max_uses: number | null;
  expires_at: string | null;
  is_stackable: boolean;
  is_active: boolean;
};

type Labels = Dictionary["admin"]["promotions"];

interface AdminPromotionsTableProps {
  locale: string;
  rows: AdminPromotionRow[];
  labels: Labels;
}

export function AdminPromotionsTable({ locale, rows, labels }: AdminPromotionsTableProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function appliesLabel(a: string) {
    if (a === "enrollment") return labels.appliesEnrollment;
    if (a === "monthly") return labels.appliesMonthly;
    return labels.appliesBoth;
  }

  async function toggle(id: string, next: boolean) {
    setBusy(true);
    const res = await togglePromotionActive(locale, id, next);
    setBusy(false);
    if (res.ok) router.refresh();
    else setMsg(res.message ?? labels.genericActionError);
  }

  async function retire(id: string) {
    if (!window.confirm(labels.confirmRetire)) return;
    setBusy(true);
    const res = await softDeletePromotion(locale, id);
    setBusy(false);
    if (res.ok) router.refresh();
    else setMsg(res.message ?? labels.genericActionError);
  }

  if (rows.length === 0) {
    return <p className="p-6 text-sm text-[var(--color-muted-foreground)]">{labels.none}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)]">
      {msg ? <p className="p-2 text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40">
          <tr>
            <th className="px-3 py-2">{labels.colCode}</th>
            <th className="px-3 py-2">{labels.colName}</th>
            <th className="px-3 py-2">{labels.colApplies}</th>
            <th className="px-3 py-2">{labels.colDiscount}</th>
            <th className="px-3 py-2">{labels.colUses}</th>
            <th className="px-3 py-2">{labels.colExpires}</th>
            <th className="px-3 py-2">{labels.colStack}</th>
            <th className="px-3 py-2">{labels.colActive}</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0">
              <td className="px-3 py-2 font-mono text-xs">{r.code}</td>
              <td className="px-3 py-2">{r.name}</td>
              <td className="px-3 py-2 text-[var(--color-muted-foreground)]">{appliesLabel(r.applies_to)}</td>
              <td className="px-3 py-2">
                {r.discount_type === "percent" ? `${r.discount_value}%` : r.discount_value}
              </td>
              <td className="px-3 py-2">
                {r.max_uses != null ? `${r.uses_count}/${r.max_uses}` : `${r.uses_count}`}
              </td>
              <td className="px-3 py-2 text-[var(--color-muted-foreground)]">
                {r.expires_at ? new Date(r.expires_at).toLocaleString() : labels.eternal}
              </td>
              <td className="px-3 py-2">{r.is_stackable ? labels.symbolYes : labels.symbolNo}</td>
              <td className="px-3 py-2">
                <button
                  type="button"
                  className="text-sm text-[var(--color-primary)] underline"
                  disabled={busy}
                  onClick={() => toggle(r.id, !r.is_active)}
                >
                  {r.is_active ? labels.toggleOff : labels.toggleOn}
                </button>
              </td>
              <td className="px-3 py-2">
                <button
                  type="button"
                  className="text-sm text-[var(--color-secondary)] underline"
                  disabled={busy}
                  onClick={() => retire(r.id)}
                >
                  {labels.deleteSoft}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
