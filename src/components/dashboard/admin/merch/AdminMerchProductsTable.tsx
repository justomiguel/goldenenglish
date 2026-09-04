"use client";

import Image from "next/image";
import { Pause, Pencil, Play } from "lucide-react";
import { SortableTh } from "@/components/molecules/SortableTh";
import { useClientTableSort } from "@/hooks/useClientTableSort";
import { tableSortLabels } from "@/lib/i18n/tableSortLabels";
import type {
  AdminMerchLabels,
  AdminMerchProductRow,
} from "@/components/dashboard/admin/merch/adminMerchTypes";

interface AdminMerchProductsTableProps {
  locale: string;
  rows: AdminMerchProductRow[];
  labels: AdminMerchLabels;
  busy: boolean;
  selectedId: string | null;
  onEdit: (id: string) => void;
  onToggle: (id: string, next: boolean) => void;
}

export function AdminMerchProductsTable({
  locale,
  rows,
  labels,
  busy,
  selectedId,
  onEdit,
  onToggle,
}: AdminMerchProductsTableProps) {
  const sortLabels = tableSortLabels(locale);
  const { sortKey, sortDir, onToggleSort, sortedRows } = useClientTableSort(
    rows,
    {
      title: (r) => r.title,
      variants: (r) => r.variants.length,
      stock: (r) => r.variants.reduce((sum, v) => sum + v.stock, 0),
      active: (r) => (r.active ? 1 : 0),
    },
    "title",
  );

  if (rows.length === 0) {
    return (
      <p
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-6 text-center text-sm text-[var(--color-muted-foreground)] shadow-[var(--shadow-soft)]"
        role="status"
      >
        {labels.none}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-[var(--shadow-soft)]">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40">
          <tr>
            <th className="px-3 py-2" scope="col">
              <span className="sr-only">{labels.createPhoto}</span>
            </th>
            <SortableTh columnId="title" label={labels.colTitle} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
            <SortableTh columnId="variants" label={labels.colVariants} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
            <SortableTh columnId="stock" label={labels.colStock} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
            <SortableTh columnId="active" label={labels.colActive} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
            <th className="px-3 py-2" scope="col">
              <span className="sr-only">{labels.colActions}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr
              key={row.id}
              className={`border-b border-[var(--color-border)] last:border-0 ${selectedId === row.id ? "bg-[var(--color-muted)]/30" : ""}`}
            >
              <td className="px-3 py-2">
                {row.imageUrl ? (
                  <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-[var(--color-muted)]">
                    <Image src={row.imageUrl} alt="" fill sizes="40px" className="object-cover" />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-[var(--color-muted)]" aria-hidden />
                )}
              </td>
              <td className="px-3 py-2 font-medium">{row.title}</td>
              <td className="px-3 py-2 text-[var(--color-muted-foreground)]">{row.variants.length}</td>
              <td className="px-3 py-2 text-[var(--color-muted-foreground)]">
                {row.variants.reduce((sum, v) => sum + v.stock, 0)}
              </td>
              <td className="px-3 py-2">
                <button
                  type="button"
                  className="inline-flex min-h-[36px] items-center gap-1.5 text-sm text-[var(--color-primary)] underline"
                  disabled={busy}
                  title={labels.tipToggleActive}
                  onClick={() => onToggle(row.id, !row.active)}
                >
                  {row.active ? (
                    <Pause className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  ) : (
                    <Play className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  )}
                  {row.active ? labels.toggleOff : labels.toggleOn}
                </button>
              </td>
              <td className="px-3 py-2">
                <button
                  type="button"
                  className="inline-flex min-h-[36px] items-center gap-1.5 text-sm text-[var(--color-primary)] underline"
                  disabled={busy}
                  title={labels.tipEdit}
                  onClick={() => onEdit(row.id)}
                >
                  <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {labels.editCta}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
