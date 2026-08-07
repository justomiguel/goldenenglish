import { Scale, Wallet } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { SectionFeePlanWithUsage } from "@/types/sectionFeePlan";
import { AcademicSectionAdvanceMonthlyPaymentEditor } from "@/components/organisms/AcademicSectionAdvanceMonthlyPaymentEditor";
import { AcademicSectionEnrollmentFeeEditor } from "@/components/organisms/AcademicSectionEnrollmentFeeEditor";
import { AcademicSectionFeePlansEditor } from "@/components/organisms/AcademicSectionFeePlansEditor";
import { AcademicSectionMonthlyFeeChargeModeEditor } from "@/components/organisms/AcademicSectionMonthlyFeeChargeModeEditor";
import { AcademicSectionAreaBlock } from "@/components/molecules/AcademicSectionAreaBlock";
import {
  AcademicSectionFeesSummary,
  type AcademicSectionFeesSummaryDict,
} from "@/components/molecules/AcademicSectionFeesSummary";
import { resolveSectionFeesSummaryPlan } from "@/lib/billing/resolveSectionFeesSummaryPlan";
import type { MonthlyFeeChargeMode } from "@/lib/billing/monthlyFeeChargeMode";

type FeePlansDict = Dictionary["dashboard"]["academicSectionPage"]["feePlans"];
type EnrollmentDict = Dictionary["dashboard"]["academicSectionPage"]["enrollmentFee"];
type ChargeModeDict = Dictionary["dashboard"]["academicSectionPage"]["monthlyFeeChargeMode"];
type AdvanceDict = Dictionary["dashboard"]["academicSectionPage"]["allowAdvanceMonthlyPayment"];

export interface AcademicSectionFeesPanelDict {
  summary: AcademicSectionFeesSummaryDict;
  amountsTitle: string;
  amountsLead: string;
  chargeRulesTitle: string;
  chargeRulesLead: string;
}

export interface AcademicSectionFeesPanelProps {
  dict: AcademicSectionFeesPanelDict;
  locale: string;
  sectionId: string;
  asOfYear: number;
  asOfMonth: number;
  feePlans: SectionFeePlanWithUsage[];
  feePlansDict: FeePlansDict;
  systemCurrency: string;
  enrollmentFeeAmount: number;
  enrollmentFeeDict: EnrollmentDict;
  chargeMode: MonthlyFeeChargeMode;
  monthlyFeeChargeModeDict: ChargeModeDict;
  allowAdvance: boolean;
  allowAdvanceMonthlyPaymentDict: AdvanceDict;
}

function chargeModeLabel(mode: MonthlyFeeChargeMode, d: ChargeModeDict): string {
  return mode === "full_month_fee" ? d.optionFullMonth : d.optionProrate;
}

export function AcademicSectionFeesPanel({
  dict,
  locale,
  sectionId,
  asOfYear,
  asOfMonth,
  feePlans,
  feePlansDict,
  systemCurrency,
  enrollmentFeeAmount,
  enrollmentFeeDict,
  chargeMode,
  monthlyFeeChargeModeDict,
  allowAdvance,
  allowAdvanceMonthlyPaymentDict,
}: AcademicSectionFeesPanelProps) {
  const currentPlan = resolveSectionFeesSummaryPlan(feePlans, asOfYear, asOfMonth);

  return (
    <div className="space-y-8">
      <AcademicSectionFeesSummary
        dict={dict.summary}
        feePlansDict={feePlansDict}
        currentPlan={currentPlan}
        enrollmentFeeAmount={enrollmentFeeAmount}
        systemCurrency={systemCurrency}
        chargeModeLabel={chargeModeLabel(chargeMode, monthlyFeeChargeModeDict)}
        allowAdvance={allowAdvance}
      />

      <AcademicSectionAreaBlock
        id="section-fees-amounts-heading"
        title={dict.amountsTitle}
        lead={dict.amountsLead}
        icon={Wallet}
      >
        <AcademicSectionFeePlansEditor
          locale={locale}
          sectionId={sectionId}
          initialPlans={feePlans}
          systemCurrency={systemCurrency}
          dict={feePlansDict}
          embedded
        />
        <AcademicSectionEnrollmentFeeEditor
          locale={locale}
          sectionId={sectionId}
          initialAmount={enrollmentFeeAmount}
          dict={enrollmentFeeDict}
          embedded
        />
      </AcademicSectionAreaBlock>

      <AcademicSectionAreaBlock
        id="section-fees-rules-heading"
        title={dict.chargeRulesTitle}
        lead={dict.chargeRulesLead}
        icon={Scale}
      >
        <AcademicSectionMonthlyFeeChargeModeEditor
          locale={locale}
          sectionId={sectionId}
          initialMode={chargeMode}
          dict={monthlyFeeChargeModeDict}
          embedded
        />
        <AcademicSectionAdvanceMonthlyPaymentEditor
          locale={locale}
          sectionId={sectionId}
          initialAllowAdvance={allowAdvance}
          dict={allowAdvanceMonthlyPaymentDict}
          embedded
        />
      </AcademicSectionAreaBlock>
    </div>
  );
}
