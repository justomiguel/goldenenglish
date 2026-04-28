"use client";

import { Ban, Pencil } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { AdminStudentBillingScholarshipDiscountMonths } from "@/components/dashboard/AdminStudentBillingScholarshipDiscountMonths";
import type { AdminBillingScholarship } from "@/types/adminStudentBilling";
import type { Dictionary } from "@/types/i18n";

type BillingLabels = Dictionary["admin"]["billing"];

function formatMonthYear(month: number, year: number): string {
  return `${String(month).padStart(2, "0")}/${year}`;
}

export interface AdminStudentBillingScholarshipActiveCardProps {
  row: AdminBillingScholarship;
  labels: BillingLabels;
  busy: boolean;
  readOnly?: boolean;
  onEdit: (row: AdminBillingScholarship) => void;
  onRemove: (row: AdminBillingScholarship) => void;
}

export function AdminStudentBillingScholarshipActiveCard({
  row,
  labels,
  busy,
  readOnly = false,
  onEdit,
  onRemove,
}: AdminStudentBillingScholarshipActiveCardProps) {
  return (
    <article
      className="rounded-[var(--layout-border-radius)] border border-[var(--color-info)] bg-[var(--color-info)]/10 px-4 py-3"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-foreground)]">
            {labels.scholarshipCurrentActive.replace("{percent}", String(row.discount_percent))}
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            {labels.scholarshipCurrentFrom}: {formatMonthYear(row.valid_from_month, row.valid_from_year)} ·{" "}
            {labels.scholarshipCurrentUntil}:{" "}
            {row.valid_until_year != null && row.valid_until_month != null
              ? formatMonthYear(row.valid_until_month, row.valid_until_year)
              : labels.scholarshipCurrentNoEnd}
          </p>
          {row.note ? (
            <p className="mt-1 text-xs text-[var(--color-foreground)]">
              {labels.scholarshipCurrentNote}: {row.note}
            </p>
          ) : null}
        </div>
        {!readOnly ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => onEdit(row)}
              className="min-h-[36px] text-xs"
            >
              <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {labels.editScholarship}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => void onRemove(row)}
              className="min-h-[36px] border border-[var(--color-error)] text-xs text-[var(--color-error)]"
            >
              <Ban className="h-3.5 w-3.5 shrink-0 text-[var(--color-foreground)]" aria-hidden />
              {labels.deactivateScholarship}
            </Button>
          </div>
        ) : null}
      </div>
      <AdminStudentBillingScholarshipDiscountMonths scholarship={row} labels={labels} />
    </article>
  );
}
