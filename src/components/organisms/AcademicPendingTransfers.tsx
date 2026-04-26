"use client";

import { Check } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
import { approveSectionTransferRequestAction } from "@/app/[locale]/dashboard/admin/academics/actions";
import type { AcademicTransferNotificationDict } from "@/app/[locale]/dashboard/admin/academic/transferActions";

export interface PendingTransferRow {
  id: string;
  studentId: string;
  fromSectionId: string;
  toSectionId: string;
  createdAt: string;
}

export interface AcademicPendingTransfersProps {
  locale: string;
  dict: Dictionary;
  rows: PendingTransferRow[];
  notificationDict: AcademicTransferNotificationDict;
}

export function AcademicPendingTransfers({
  locale,
  dict,
  rows,
  notificationDict,
}: AcademicPendingTransfersProps) {
  const d = dict.dashboard.academics.pendingTransfers;
  const router = useRouter();
  const [pending, start] = useTransition();

  if (rows.length === 0) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">{d.empty}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)]">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[var(--color-muted)]/50 text-xs uppercase text-[var(--color-muted-foreground)]">
          <tr>
            <th className="px-3 py-2">{d.colStudent}</th>
            <th className="px-3 py-2">{d.colFrom}</th>
            <th className="px-3 py-2">{d.colTo}</th>
            <th className="px-3 py-2">{d.colAction}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-[var(--color-border)]">
              <td className="px-3 py-2 font-mono text-xs">{r.studentId}</td>
              <td className="px-3 py-2 font-mono text-xs">{r.fromSectionId}</td>
              <td className="px-3 py-2 font-mono text-xs">{r.toSectionId}</td>
              <td className="px-3 py-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={pending}
                  title={d.approveTooltip}
                  onClick={() => {
                    start(async () => {
                      await approveSectionTransferRequestAction({
                        locale,
                        requestId: r.id,
                        notificationDict,
                      });
                      router.refresh();
                    });
                  }}
                >
                  <Check className="h-4 w-4 shrink-0" aria-hidden />
                  {d.approve}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
