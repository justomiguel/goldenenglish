"use client";

import { GraduationCap } from "lucide-react";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { runBulkSectionScholarshipAction } from "@/app/[locale]/dashboard/admin/finance/collections/[sectionId]/runBulkSectionScholarshipAction";
import { Button } from "@/components/atoms/Button";
import type { Dictionary, Locale } from "@/types/i18n";
import { SectionBulkScholarshipModal, type BulkScholarshipScope } from "./SectionBulkScholarshipModal";

type CollectionsDict = Dictionary["admin"]["finance"]["collections"];
type BillingLabels = Dictionary["admin"]["billing"];

export interface SectionCollectionsBulkScholarshipTriggerProps {
  locale: Locale;
  sectionId: string;
  year: number;
  studentCount: number;
  selectedStudentIds: string[];
  dict: CollectionsDict;
  billingLabels: BillingLabels;
  referenceMonthlyAmount: number | null;
  referenceMonthlyCurrency: string | null;
  onNotice: (msg: string | null) => void;
}

export function SectionCollectionsBulkScholarshipTrigger({
  locale,
  sectionId,
  year,
  studentCount,
  selectedStudentIds,
  dict,
  billingLabels,
  referenceMonthlyAmount,
  referenceMonthlyCurrency,
  onNotice,
}: SectionCollectionsBulkScholarshipTriggerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleConfirm = useCallback(
    async (params: {
      discountPercent: number;
      scope: BulkScholarshipScope;
      fromMonth: number;
      toMonth: number;
      note?: string;
    }) => {
      setBusy(true);
      onNotice(null);
      const result = await runBulkSectionScholarshipAction({
        locale,
        sectionId,
        year,
        discountPercent: params.discountPercent,
        scope: params.scope,
        selectedStudentIds: params.scope === "selected" ? selectedStudentIds : undefined,
        fromMonth: params.fromMonth,
        toMonth: params.toMonth,
        note: params.note,
      });
      setBusy(false);
      setOpen(false);
      const d = dict.bulkScholarship;
      if (result.ok) {
        onNotice(d.resultOk.replace("{count}", String(result.successCount)));
        router.refresh();
      } else if (result.failedCount > 0) {
        onNotice(
          d.resultPartial
            .replace("{ok}", String(result.successCount))
            .replace("{failed}", String(result.failedCount)),
        );
      } else {
        onNotice(result.message ?? d.resultError);
      }
    },
    [locale, sectionId, year, selectedStudentIds, dict.bulkScholarship, router, onNotice],
  );

  return (
    <>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <GraduationCap className="h-4 w-4" aria-hidden />
        {dict.bulkScholarship.title}
      </Button>
      <SectionBulkScholarshipModal
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleConfirm}
        busy={busy}
        dict={dict}
        billingLabels={billingLabels}
        locale={locale}
        referenceMonthlyAmount={referenceMonthlyAmount}
        referenceMonthlyCurrency={referenceMonthlyCurrency}
        studentCount={studentCount}
        selectedStudentCount={selectedStudentIds.length}
        year={year}
      />
    </>
  );
}
