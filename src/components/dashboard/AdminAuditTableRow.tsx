"use client";

import { Eye } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { AdminAuditRow } from "@/types/audit";
import type { Dictionary } from "@/types/i18n";

type AuditLabels = Dictionary["admin"]["audit"];

export interface AdminAuditTableRowProps {
  row: AdminAuditRow;
  labels: AuditLabels;
  locale: string;
  onOpenDetails: (row: AdminAuditRow) => void;
}

export function AdminAuditTableRow({
  row,
  labels,
  locale,
  onOpenDetails,
}: AdminAuditTableRowProps) {
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(row.createdAt));

  return (
    <tr className="border-b border-[var(--color-border)] align-top last:border-0">
      <td className="px-3 py-3 text-xs text-[var(--color-muted-foreground)]">{date}</td>
      <td className="px-3 py-3">
        <div className="font-medium text-[var(--color-foreground)]">{row.actorName || labels.unknownActor}</div>
        <div className="text-xs text-[var(--color-muted-foreground)]">{row.actorRole ?? labels.unknownRole}</div>
      </td>
      <td className="px-3 py-3 text-sm">{row.domain}</td>
      <td className="px-3 py-3 text-sm">{row.action}</td>
      <td className="px-3 py-3 text-sm">
        <div>{row.resourceType}</div>
        <div className="break-all text-xs text-[var(--color-muted-foreground)]">{row.resourceId ?? labels.emptyValue}</div>
      </td>
      <td className="px-3 py-3 text-sm">{row.summary || labels.emptyValue}</td>
      <td className="px-3 py-3 text-right">
        <Button type="button" variant="ghost" size="sm" onClick={() => onOpenDetails(row)}>
          <Eye className="h-4 w-4" aria-hidden />
          {labels.openDetails}
        </Button>
      </td>
    </tr>
  );
}
