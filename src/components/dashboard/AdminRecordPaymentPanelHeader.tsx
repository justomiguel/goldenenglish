import type { Dictionary } from "@/types/i18n";

type BillingLabels = Dictionary["admin"]["billing"];

export interface AdminRecordPaymentPanelHeaderProps {
  labels: BillingLabels;
  sectionName: string;
  year: number;
}

export function AdminRecordPaymentPanelHeader({
  labels,
  sectionName,
  year,
}: AdminRecordPaymentPanelHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-display font-semibold text-[var(--color-secondary)]">
          {labels.recordPaymentMatrixTitle}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          {labels.recordPaymentMatrixHelp}
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          {labels.recordPaymentMatrixLead.replace("{section}", sectionName).replace("{year}", String(year))}
        </p>
      </div>
      <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1 text-xs font-semibold text-[var(--color-muted-foreground)]">
        {labels.recordPaymentMatrixAuditBadge}
      </span>
    </div>
  );
}
