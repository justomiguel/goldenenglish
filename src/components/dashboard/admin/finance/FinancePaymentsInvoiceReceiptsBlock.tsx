import Link from "next/link";
import type { Dictionary } from "@/types/i18n";

type PortalBillingDict = Dictionary["dashboard"]["portalBilling"];

interface InvoiceLite {
  id: string;
  description: string;
  amount: number;
  student_id: string;
}

export interface FinancePaymentsInvoiceReceiptsBlockProps {
  invList: { id: string; created_at: string; amount_paid: number; invoice_id: string }[];
  invById: Record<string, InvoiceLite>;
  invNameById: Record<string, string>;
  portalBillingDict: PortalBillingDict;
  receiptHrefBase: string;
}

export function FinancePaymentsInvoiceReceiptsBlock({
  invList,
  invById,
  invNameById,
  portalBillingDict,
  receiptHrefBase,
}: FinancePaymentsInvoiceReceiptsBlockProps) {
  if (invList.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="font-display text-base font-semibold text-[var(--color-primary)]">
        {portalBillingDict.adminListTitle}
      </h2>
      <ul className="space-y-3">
        {invList.map((r) => {
          const inv = invById[r.invoice_id as string];
          const sid = inv?.student_id;
          return (
            <li
              key={r.id as string}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
            >
              <div>
                <p className="font-medium text-[var(--color-foreground)]">
                  {sid ? (invNameById[sid] ?? sid) : "—"}
                </p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {inv?.description ?? "—"} · {portalBillingDict.adminColAmount}:{" "}
                  {r.amount_paid as number}
                </p>
              </div>
              <Link
                href={`${receiptHrefBase}/${r.id}`}
                title={portalBillingDict.tipOpenReceiptReview}
                className="rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)]"
              >
                {portalBillingDict.openReview}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
