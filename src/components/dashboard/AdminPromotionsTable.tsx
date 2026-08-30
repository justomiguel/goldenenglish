"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import { SortableTh } from "@/components/molecules/SortableTh";
import { useClientTableSort } from "@/hooks/useClientTableSort";
import { tableSortLabels } from "@/lib/i18n/tableSortLabels";
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
  const [retireTargetId, setRetireTargetId] = useState<string | null>(null);

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
    setBusy(true);
    const res = await softDeletePromotion(locale, id);
    setBusy(false);
    setRetireTargetId(null);
    if (res.ok) router.refresh();
    else setMsg(res.message ?? labels.genericActionError);
  }

  const sortLabels = tableSortLabels(locale);
  const { sortKey, sortDir, onToggleSort, sortedRows } = useClientTableSort(
    rows,
    {
      code: (r) => r.code,
      name: (r) => r.name,
      applies: (r) => appliesLabel(r.applies_to),
      discount: (r) => r.discount_value,
      uses: (r) => r.uses_count,
      expires: (r) => r.expires_at ?? "",
      stack: (r) => (r.is_stackable ? 1 : 0),
      active: (r) => (r.is_active ? 1 : 0),
    },
    "code",
  );

  if (rows.length === 0) {
    return <p className="p-6 text-sm text-[var(--color-muted-foreground)]">{labels.none}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-[var(--shadow-soft)]">
      {msg ? <p className="p-2 text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40">
          <tr>
            <SortableTh columnId="code" label={labels.colCode} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
            <SortableTh columnId="name" label={labels.colName} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
            <SortableTh columnId="applies" label={labels.colApplies} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
            <SortableTh columnId="discount" label={labels.colDiscount} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
            <SortableTh columnId="uses" label={labels.colUses} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
            <SortableTh columnId="expires" label={labels.colExpires} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
            <SortableTh columnId="stack" label={labels.colStack} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
            <SortableTh columnId="active" label={labels.colActive} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((r) => (
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
                  title={labels.tipToggleActive}
                  onClick={() => toggle(r.id, !r.is_active)}
                >
                  {r.is_active ? labels.toggleOff : labels.toggleOn}
                </button>
              </td>
              <td className="px-3 py-2">
                <button
                  type="button"
                  className="text-sm text-[var(--color-error)] underline"
                  disabled={busy}
                  title={labels.tipRetire}
                  onClick={() => setRetireTargetId(r.id)}
                >
                  {labels.deleteSoft}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ConfirmActionModal
        open={retireTargetId !== null}
        onOpenChange={(o) => {
          if (!o) setRetireTargetId(null);
        }}
        title={labels.retireModalTitle}
        description={labels.confirmRetire}
        cancelLabel={labels.modalCancel}
        confirmLabel={labels.retireModalConfirm}
        confirmVariant="destructive"
        busy={busy}
        onConfirm={() => {
          if (retireTargetId) void retire(retireTargetId);
        }}
      />
    </div>
  );
}
