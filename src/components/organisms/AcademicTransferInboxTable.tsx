"use client";

import { Check, ListChecks, X } from "lucide-react";
import { useMemo, useOptimistic, useState, useTransition } from "react";
import {
  sortAdminTransferInboxRows,
  type TransferInboxSortKey,
} from "@/lib/academics/sortAdminTransferInboxRows";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/types/i18n";
import type { AcademicTransferNotificationDict } from "@/app/[locale]/dashboard/admin/academic/transferActions";
import { Button } from "@/components/atoms/Button";
import {
  approveSectionTransferRequestAction,
  bulkApproveSectionTransferRequestsAction,
  rejectSectionTransferRequestAction,
} from "@/app/[locale]/dashboard/admin/academics/actions";
import type { AdminTransferInboxRow } from "@/types/adminTransferInbox";
import { AcademicTransferInboxTableHead } from "@/components/organisms/AcademicTransferInboxTableHead";
import type { UniversalSortDir } from "@/types/universalListView";

export type { AdminTransferInboxRow as TransferInboxRow };

type Peel = { type: "remove"; ids: readonly string[] };

export interface AcademicTransferInboxTableProps {
  locale: string;
  rows: AdminTransferInboxRow[];
  dict: Dictionary["dashboard"]["academicRequests"];
  notificationDict: AcademicTransferNotificationDict;
}

export function AcademicTransferInboxTable({
  locale,
  rows,
  dict,
  notificationDict,
}: AcademicTransferInboxTableProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<TransferInboxSortKey>("student");
  const [sortDir, setSortDir] = useState<UniversalSortDir>("asc");

  const [optimistic, peel] = useOptimistic(rows, (state, u: Peel) =>
    u.type === "remove" ? state.filter((r) => !u.ids.includes(r.id)) : state,
  );

  const sortedRows = useMemo(
    () => sortAdminTransferInboxRows(optimistic, sortKey, sortDir),
    [optimistic, sortKey, sortDir],
  );

  const onToggleSort = (columnId: string) => {
    const id = columnId as TransferInboxSortKey;
    if (sortKey !== id) {
      setSortKey(id);
      setSortDir("asc");
      return;
    }
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  };

  const visibleRowIds = useMemo(() => new Set(optimistic.map((r) => r.id)), [optimistic]);
  const hasVisibleSelection = useMemo(
    () => [...selected].some((id) => visibleRowIds.has(id)),
    [selected, visibleRowIds],
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleAllVisible = () => {
    if (selected.size === sortedRows.length) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(sortedRows.map((r) => r.id)));
  };

  const silentRefresh = () => {
    router.refresh();
  };

  const approve = (id: string) => {
    start(() => {
      peel({ type: "remove", ids: [id] });
      void (async () => {
        await approveSectionTransferRequestAction({
          locale,
          requestId: id,
          notificationDict,
        });
        silentRefresh();
      })();
    });
  };

  const reject = (id: string) => {
    start(() => {
      peel({ type: "remove", ids: [id] });
      void (async () => {
        const r = await rejectSectionTransferRequestAction({ locale, requestId: id });
        if (!r.ok) silentRefresh();
        else silentRefresh();
      })();
    });
  };

  const bulkApprove = () => {
    const ids = [...selected].filter((id) => visibleRowIds.has(id));
    if (ids.length === 0) return;
    setBulkMsg(null);
    start(() => {
      peel({ type: "remove", ids });
      void (async () => {
        const { failedIds } = await bulkApproveSectionTransferRequestsAction({
          locale,
          requestIds: ids,
          notificationDict,
        });
        setSelected(new Set());
        if (failedIds.length > 0) {
          setBulkMsg(dict.bulkPartial);
          silentRefresh();
        } else {
          silentRefresh();
        }
      })();
    });
  };

  const allSelected = sortedRows.length > 0 && selected.size === sortedRows.length;

  return (
    <div className="space-y-3">
      {sortedRows.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            disabled={pending || !hasVisibleSelection}
            title={dict.tipBulkApprove}
            onClick={bulkApprove}
          >
            <Check className="h-4 w-4 shrink-0" aria-hidden />
            {dict.bulkApprove}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            title={allSelected ? dict.tipClearSelection : dict.tipSelectAll}
            onClick={toggleAllVisible}
          >
            <ListChecks className="h-4 w-4 shrink-0" aria-hidden />
            {allSelected ? dict.clearSelection : dict.selectAll}
          </Button>
        </div>
      ) : null}
      {bulkMsg ? <p className="text-sm text-[var(--color-muted-foreground)]">{bulkMsg}</p> : null}
      <div className="overflow-x-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <AcademicTransferInboxTableHead
              dict={dict}
              sortKey={sortKey}
              sortDir={sortDir}
              allSelected={allSelected}
              pending={pending}
              sortedRowsLength={sortedRows.length}
              onToggleSort={onToggleSort}
              onToggleAllVisible={toggleAllVisible}
            />
            <tbody>
              {sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-[var(--color-muted-foreground)]">
                    {dict.empty}
                  </td>
                </tr>
              ) : (
                sortedRows.map((r) => (
                  <tr key={r.id} className="border-t border-[var(--color-border)]">
                    <td className="px-2 py-2 align-top">
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggle(r.id)}
                        disabled={pending}
                        aria-label={dict.colSelect}
                      />
                    </td>
                    <td className="px-3 py-2 font-medium">{r.studentLabel}</td>
                    <td className="px-3 py-2 text-[var(--color-muted-foreground)]">{r.fromLabel}</td>
                    <td className="px-3 py-2 text-[var(--color-muted-foreground)]">{r.toLabel}</td>
                    <td className="px-3 py-2 text-[var(--color-muted-foreground)]">{r.byLabel}</td>
                    <td className="px-3 py-2 text-[var(--color-muted-foreground)]">{r.note ?? "—"}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={pending}
                          title={dict.tipApproveRequest}
                          onClick={() => approve(r.id)}
                        >
                          <Check className="h-4 w-4 shrink-0" aria-hidden />
                          {dict.approve}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={pending}
                          title={dict.tipRejectRequest}
                          onClick={() => reject(r.id)}
                        >
                          <X className="h-4 w-4 shrink-0" aria-hidden />
                          {dict.reject}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
