"use client";

import type { Dictionary } from "@/types/i18n";
import type { MonthlyFeeChargeMode } from "@/lib/billing/monthlyFeeChargeMode";
import { AcademicSectionMonthlyFeeChargeModeEditor } from "@/components/organisms/AcademicSectionMonthlyFeeChargeModeEditor";

type EditorDict = Dictionary["dashboard"]["academicSectionPage"]["monthlyFeeChargeMode"];

export interface SectionCollectionsBillingSettingsTabProps {
  locale: string;
  sectionId: string;
  initialMode: MonthlyFeeChargeMode;
  lead: string;
  editorDict: EditorDict;
}

export function SectionCollectionsBillingSettingsTab({
  locale,
  sectionId,
  initialMode,
  lead,
  editorDict,
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
    </div>
  );
}
