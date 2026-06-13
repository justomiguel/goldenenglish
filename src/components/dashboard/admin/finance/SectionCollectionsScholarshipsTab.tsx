"use client";

import { GraduationCap } from "lucide-react";
import { useState } from "react";
import type { SectionCollectionsScholarshipListRow } from "@/types/sectionCollectionsTabs";
import type { SectionCollectionsView } from "@/types/sectionCollections";
import type { Dictionary, Locale } from "@/types/i18n";
import { SectionCollectionsBulkScholarshipTrigger } from "./SectionCollectionsBulkScholarshipTrigger";
import { SectionCollectionsScholarshipRemoveButton } from "./SectionCollectionsScholarshipRemoveButton";

type CollectionsDict = Dictionary["admin"]["finance"]["collections"];

function formatPeriod(month: number, year: number): string {
  return `${String(month).padStart(2, "0")}/${year}`;
}

export interface SectionCollectionsScholarshipsTabProps {
  locale: string;
  view: SectionCollectionsView;
  scholarships: SectionCollectionsScholarshipListRow[];
  dict: CollectionsDict;
  billingLabels: Dictionary["admin"]["billing"];
}

export function SectionCollectionsScholarshipsTab({
  locale,
  view,
  scholarships,
  dict,
  billingLabels,
}: SectionCollectionsScholarshipsTabProps) {
  const t = dict.sectionTabs;
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {notice ? (
        <p className="text-sm text-[var(--color-muted-foreground)]" role="status">
          {notice}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <GraduationCap className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" aria-hidden />
        <p className="text-sm text-[var(--color-muted-foreground)]">{t.scholarshipsBulkHint}</p>
        <SectionCollectionsBulkScholarshipTrigger
          locale={locale as Locale}
          sectionId={view.sectionId}
          year={view.year}
          studentCount={view.students.length}
          selectedStudentIds={[]}
          dict={dict}
          billingLabels={billingLabels}
          referenceMonthlyAmount={view.referenceMonthlyFeeAmount}
          referenceMonthlyCurrency={view.referenceMonthlyFeeCurrency}
          onNotice={setNotice}
        />
      </div>
      <p className="text-sm text-[var(--color-muted-foreground)]">{t.scholarshipsLead}</p>
      {scholarships.length === 0 ? (
        <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/15 p-4 text-sm text-[var(--color-muted-foreground)]">
          {t.scholarshipsEmpty}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)]">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40">
              <tr>
                <th className="px-3 py-2">{t.scholarshipsColStudent}</th>
                <th className="px-3 py-2">{t.scholarshipsColDiscount}</th>
                <th className="px-3 py-2">{t.scholarshipsColPeriod}</th>
                <th className="px-3 py-2">{billingLabels.scholarshipCurrentNote}</th>
                <th className="px-3 py-2">{t.scholarshipsColActions}</th>
              </tr>
            </thead>
            <tbody>
              {scholarships.map((row) => {
                const s = row.scholarship;
                const from = formatPeriod(s.valid_from_month, s.valid_from_year);
                const until =
                  s.valid_until_year != null && s.valid_until_month != null
                    ? formatPeriod(s.valid_until_month, s.valid_until_year)
                    : billingLabels.scholarshipCurrentNoEnd;
                const period = `${billingLabels.scholarshipCurrentFrom} ${from} · ${billingLabels.scholarshipCurrentUntil} ${until}`;
                return (
                  <tr key={row.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-3 py-2 font-medium text-[var(--color-foreground)]">
                      {row.studentDisplayName}
                    </td>
                    <td className="px-3 py-2">{s.discount_percent}%</td>
                    <td className="px-3 py-2 text-xs text-[var(--color-muted-foreground)]">{period}</td>
                    <td className="px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
                      {s.note ?? billingLabels.emptyValue}
                    </td>
                    <td className="px-3 py-2">
                      <SectionCollectionsScholarshipRemoveButton
                        locale={locale as Locale}
                        sectionId={view.sectionId}
                        studentId={row.studentId}
                        scholarshipId={row.id}
                        labels={billingLabels}
                        onNotice={setNotice}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
