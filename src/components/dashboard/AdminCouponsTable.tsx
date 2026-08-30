import { Power } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { SortableTh } from "@/components/molecules/SortableTh";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import type { AdminCouponRow } from "@/components/dashboard/AdminCouponsEntry";
import type { Dictionary } from "@/types/i18n";
import type { UniversalListSortLabels, UniversalSortDir } from "@/types/universalListView";

interface AdminCouponsTableProps {
  rows: AdminCouponRow[];
  labels: Dictionary["admin"]["coupons"];
  sortKey: string;
  sortDir: UniversalSortDir;
  onToggleSort: (columnId: string) => void;
  sortLabels: UniversalListSortLabels;
  busy: boolean;
  onToggle: (id: string, next: boolean) => void;
}

export function AdminCouponsTable({
  rows,
  labels,
  sortKey,
  sortDir,
  onToggleSort,
  sortLabels,
  busy,
  onToggle,
}: AdminCouponsTableProps) {
  return (
    <section
      data-tour={ADMIN_TOUR_ANCHORS.couponsTable}
      className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-[var(--shadow-soft)]"
    >
      {rows.length === 0 ? (
        <p className="p-6 text-sm text-[var(--color-muted-foreground)]">{labels.none}</p>
      ) : (
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40">
            <tr>
              <SortableTh columnId="code" label={labels.colCode} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
              <SortableTh columnId="type" label={labels.colType} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
              <SortableTh columnId="value" label={labels.colValue} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
              <SortableTh columnId="validFrom" label={labels.colValidFrom} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
              <SortableTh columnId="validUntil" label={labels.colValidUntil} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
              <SortableTh columnId="uses" label={labels.colUses} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
              <SortableTh columnId="active" label={labels.colActive} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0">
                <td className="px-3 py-2 font-mono text-xs">{r.code}</td>
                <td className="px-3 py-2">
                  {r.discount_type === "percent" ? labels.typePercent : labels.typeFixed}
                </td>
                <td className="px-3 py-2">{r.discount_value}</td>
                <td className="px-3 py-2 text-[var(--color-muted-foreground)]">
                  {new Date(r.valid_from).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-[var(--color-muted-foreground)]">
                  {r.valid_until ? new Date(r.valid_until).toLocaleString() : labels.eternal}
                </td>
                <td className="px-3 py-2">
                  {r.max_uses != null ? `${r.uses_count}/${r.max_uses}` : `${r.uses_count} (${labels.unlimited})`}
                </td>
                <td className="px-3 py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-[36px] px-2 text-sm text-[var(--color-primary)] underline"
                    disabled={busy}
                    title={labels.tipToggleRow}
                    onClick={() => onToggle(r.id, !r.is_active)}
                  >
                    <Power className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {r.is_active ? labels.toggleOff : labels.toggleOn}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
