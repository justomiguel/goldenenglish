"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/types/i18n";
import type { AcademicTransferNotificationDict } from "@/app/[locale]/dashboard/admin/academic/transferActions";
import { Button } from "@/components/atoms/Button";
import {
  approveSectionTransferRequestAction,
  bulkApproveSectionTransferRequestsAction,
  rejectSectionTransferRequestAction,
} from "@/app/[locale]/dashboard/admin/academics/actions";

export type TransferInboxRow = {
  id: string;
  studentLabel: string;
  fromLabel: string;
  toLabel: string;
  byLabel: string;
  note: string | null;
  createdAt: string;
};

type Peel = { type: "remove"; ids: readonly string[] };

export interface AcademicTransferInboxTableProps {
  locale: string;
  rows: TransferInboxRow[];
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

  const [optimistic, peel] = useOptimistic(rows, (state, u: Peel) =>
    u.type === "remove" ? state.filter((r) => !u.ids.includes(r.id)) : state,
  );

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
    if (selected.size === optimistic.length) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(optimistic.map((r) => r.id)));
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

  const allSelected = optimistic.length > 0 && selected.size === optimistic.length;

  return (
    <div className="space-y-3">
      {optimistic.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            disabled={pending || !hasVisibleSelection}
            onClick={bulkApprove}
          >
            {dict.bulkApprove}
          </Button>
          <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={toggleAllVisible}>
            {allSelected ? dict.clearSelection : dict.selectAll}
          </Button>
        </div>
      ) : null}
      {bulkMsg ? <p className="text-sm text-[var(--color-muted-foreground)]">{bulkMsg}</p> : null}
      <div className="overflow-x-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40 text-xs uppercase text-[var(--color-muted-foreground)]">
              <tr>
                <th className="px-2 py-2">
                  <span className="sr-only">{dict.colSelect}</span>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAllVisible}
                    disabled={pending || optimistic.length === 0}
                    aria-label={dict.selectAll}
                  />
                </th>
                <th className="px-3 py-2">{dict.colStudent}</th>
                <th className="px-3 py-2">{dict.colFrom}</th>
                <th className="px-3 py-2">{dict.colTo}</th>
                <th className="px-3 py-2">{dict.colBy}</th>
                <th className="px-3 py-2">{dict.colNote}</th>
                <th className="px-3 py-2">{dict.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {optimistic.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-[var(--color-muted-foreground)]">
                    {dict.empty}
                  </td>
                </tr>
              ) : (
                optimistic.map((r) => (
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
                          onClick={() => approve(r.id)}
                        >
                          {dict.approve}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={pending}
                          onClick={() => reject(r.id)}
                        >
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
