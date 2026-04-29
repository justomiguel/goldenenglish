import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { CohortCollectionsMatrixSection } from "@/types/cohortCollectionsMatrix";
import type { Dictionary } from "@/types/i18n";

type TopDebtorsDict = Dictionary["admin"]["finance"]["overview"]["topDebtors"];

interface DebtorRow {
  studentId: string;
  name: string;
  sectionName: string;
  overdue: number;
}

function flattenDebtors(sections: CohortCollectionsMatrixSection[]): DebtorRow[] {
  const debtors: DebtorRow[] = [];
  for (const sec of sections) {
    const sectionName = sec.view.sectionName;
    for (const stu of sec.view.students) {
      if (stu.overdue > 0) {
        debtors.push({
          studentId: stu.studentId,
          name: stu.studentName,
          sectionName,
          overdue: stu.overdue,
        });
      }
    }
  }
  debtors.sort((a, b) => b.overdue - a.overdue);
  return debtors.slice(0, 10);
}

function formatMoney(amount: number, locale: string, currency: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export interface FinanceTopDebtorsCardProps {
  sections: CohortCollectionsMatrixSection[];
  dict: TopDebtorsDict;
  locale: string;
  currency?: string;
}

export function FinanceTopDebtorsCard({
  sections,
  dict,
  locale,
  currency = "USD",
}: FinanceTopDebtorsCardProps) {
  const top = flattenDebtors(sections);

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="mb-3 font-display text-sm font-semibold text-[var(--color-primary)]">
        {dict.title}
      </h3>
      {top.length === 0 ? (
        <p className="py-4 text-center text-sm text-[var(--color-muted-foreground)]">
          {dict.empty}
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-border)]">
          {top.map((d) => (
            <li
              key={d.studentId}
              className="flex items-center gap-3 py-2 text-sm"
            >
              <div className="flex flex-1 flex-col gap-0.5">
                <Link
                  href={`/dashboard/admin/users/${d.studentId}/billing`}
                  className="inline-flex items-center gap-1 font-medium text-[var(--color-foreground)] hover:text-[var(--color-primary)] hover:underline"
                >
                  {d.name}
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </Link>
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  {d.sectionName}
                </span>
              </div>
              <span className="font-semibold tabular-nums text-[var(--color-error)]">
                {formatMoney(d.overdue, locale, currency)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
