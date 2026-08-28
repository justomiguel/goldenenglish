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
import { resolveEffectiveMonthlyFee } from "@/lib/billing/resolveCohortFeeDefaults";
import { DEFAULT_SECTION_FEE_PLAN_CURRENCY } from "@/types/sectionFeePlan";

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
  storedEnrollmentFeeAmount: number | null;
  cohortDefaultEnrollmentFeeAmount: number | null;
  cohortDefaultMonthlyFee: number | null;
  billingMode?: string | null;
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
  storedEnrollmentFeeAmount,
  cohortDefaultEnrollmentFeeAmount,
  cohortDefaultMonthlyFee,
  billingMode = null,
  enrollmentFeeDict,
  chargeMode,
  monthlyFeeChargeModeDict,
  allowAdvance,
  allowAdvanceMonthlyPaymentDict,
}: AcademicSectionFeesPanelProps) {
  const sectionPlan = resolveSectionFeesSummaryPlan(feePlans, asOfYear, asOfMonth);
  const monthly = resolveEffectiveMonthlyFee({
    billingMode,
    sectionPlan: sectionPlan
      ? { monthlyFee: sectionPlan.monthlyFee, currency: sectionPlan.currency }
      : null,
    cohortDefaultMonthlyFee,
  });
  const currentPlan =
    monthly.kind === "section"
      ? sectionPlan
      : monthly.kind === "cohort"
        ? {
            id: "cohort-default",
            sectionId,
            effectiveFromYear: 2000,
            effectiveFromMonth: 1,
            monthlyFee: monthly.monthlyFee,
            currency: monthly.currency || systemCurrency || DEFAULT_SECTION_FEE_PLAN_CURRENCY,
            archivedAt: null,
          }
        : null;

  return (
    <div className="space-y-8">
      <AcademicSectionFeesSummary
        dict={dict.summary}
        feePlansDict={feePlansDict}
        currentPlan={currentPlan}
        enrollmentFeeAmount={enrollmentFeeAmount}
        enrollmentInherited={storedEnrollmentFeeAmount == null && enrollmentFeeAmount > 0}
        monthlyInherited={monthly.kind === "cohort"}
        inheritLabel={dict.summary.fromCohortDefault}
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
          initialAmount={storedEnrollmentFeeAmount}
          cohortDefaultAmount={cohortDefaultEnrollmentFeeAmount}
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
