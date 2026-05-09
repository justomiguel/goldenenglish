import type { Dictionary } from "@/types/i18n";
import type { AdminBillingAnnualSettlement } from "@/types/adminStudentBilling";
import { formatAnnualSettlementExistingLine } from "@/components/dashboard/adminAnnualSettlementFormatters";

export interface AdminAnnualSettlementExistingListProps {
  settlements: readonly AdminBillingAnnualSettlement[];
  labels: Dictionary["admin"]["billing"]["annualSettlement"];
  formatMoney: (amount: number, currency: string) => string;
}

export function AdminAnnualSettlementExistingList({
  settlements,
  labels,
  formatMoney,
}: AdminAnnualSettlementExistingListProps) {
  if (settlements.length === 0) return null;
  return (
    <div className="rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]/25 p-3 text-sm">
      <p className="font-medium text-[var(--color-foreground)]">{labels.existingTitle}</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-[var(--color-muted-foreground)]">
        {settlements.map((s) => (
          <li key={s.id}>
            {formatAnnualSettlementExistingLine({ settlement: s, labels, formatMoney })}
          </li>
        ))}
      </ul>
    </div>
  );
}
