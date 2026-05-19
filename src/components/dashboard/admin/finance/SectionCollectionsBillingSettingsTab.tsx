"use client";

import type { Dictionary } from "@/types/i18n";
import type { MonthlyFeeChargeMode } from "@/lib/billing/monthlyFeeChargeMode";
import { AcademicSectionMonthlyFeeChargeModeEditor } from "@/components/organisms/AcademicSectionMonthlyFeeChargeModeEditor";
import { AcademicSectionAdvanceMonthlyPaymentEditor } from "@/components/organisms/AcademicSectionAdvanceMonthlyPaymentEditor";

type EditorDict = Dictionary["dashboard"]["academicSectionPage"]["monthlyFeeChargeMode"];
type AdvanceDict = Dictionary["dashboard"]["academicSectionPage"]["allowAdvanceMonthlyPayment"];

export interface SectionCollectionsBillingSettingsTabProps {
  locale: string;
  sectionId: string;
  initialMode: MonthlyFeeChargeMode;
  initialAllowAdvance: boolean;
  lead: string;
  editorDict: EditorDict;
  advanceEditorDict: AdvanceDict;
}

export function SectionCollectionsBillingSettingsTab({
  locale,
  sectionId,
  initialMode,
  initialAllowAdvance,
  lead,
  editorDict,
  advanceEditorDict,
}: SectionCollectionsBillingSettingsTabProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-muted-foreground)]">{lead}</p>
      <AcademicSectionMonthlyFeeChargeModeEditor
        locale={locale}
        sectionId={sectionId}
        initialMode={initialMode}
        dict={editorDict}
      />
      <AcademicSectionAdvanceMonthlyPaymentEditor
        locale={locale}
        sectionId={sectionId}
        initialAllowAdvance={initialAllowAdvance}
        dict={advanceEditorDict}
      />
    </div>
  );
}
