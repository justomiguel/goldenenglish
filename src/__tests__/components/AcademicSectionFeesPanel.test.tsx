/**
 * Subject: AcademicSectionFeesPanel — summary → Amounts → Charge rules order.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AcademicSectionFeesPanel } from "@/components/organisms/AcademicSectionFeesPanel";
import type { SectionFeePlanWithUsage } from "@/types/sectionFeePlan";

vi.mock("@/components/organisms/AcademicSectionFeePlansEditor", () => ({
  AcademicSectionFeePlansEditor: ({ dict }: { dict: { title: string } }) => (
    <h3>{dict.title}</h3>
  ),
}));
vi.mock("@/components/organisms/AcademicSectionEnrollmentFeeEditor", () => ({
  AcademicSectionEnrollmentFeeEditor: ({ dict }: { dict: { title: string } }) => (
    <h3>{dict.title}</h3>
  ),
}));
vi.mock("@/components/organisms/AcademicSectionMonthlyFeeChargeModeEditor", () => ({
  AcademicSectionMonthlyFeeChargeModeEditor: ({ dict }: { dict: { title: string } }) => (
    <h3>{dict.title}</h3>
  ),
}));
vi.mock("@/components/organisms/AcademicSectionAdvanceMonthlyPaymentEditor", () => ({
  AcademicSectionAdvanceMonthlyPaymentEditor: ({ dict }: { dict: { title: string } }) => (
    <h3>{dict.title}</h3>
  ),
}));

const SECTION = "00000000-0000-4000-8000-000000000010";

const feesPanelDict = {
  summary: {
    title: "Current fees at a glance",
    monthlyPlanLabel: "Monthly plan",
    monthlyPlanEmpty: "No active monthly plan",
    enrollmentLabel: "Enrollment fee",
    enrollmentNone: "None (0)",
    fromCohortDefault: "Cohort default",
    chargeBasisLabel: "Charge basis",
    advanceLabel: "Advance payments",
    advanceYes: "Yes",
    advanceNo: "No",
  },
  amountsTitle: "Amounts",
  amountsLead: "Monthly fee plans and enrollment.",
  chargeRulesTitle: "Charge rules",
  chargeRulesLead: "How dues are calculated.",
};

const enrollmentFeeDict = { title: "Section enrollment fee" };
const monthlyFeeChargeModeDict = {
  title: "Monthly fee charge basis",
  optionProrate: "Prorate by scheduled classes",
  optionFullMonth: "Full monthly plan fee",
};
const allowAdvanceDict = { title: "Advance monthly payments" };

const plan: SectionFeePlanWithUsage = {
  id: "00000000-0000-4000-8000-000000000099",
  sectionId: SECTION,
  effectiveFromYear: 2026,
  effectiveFromMonth: 1,
  monthlyFee: 100,
  currency: "CLP",
  archivedAt: null,
  inUse: false,
};

describe("AcademicSectionFeesPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders summary then Amounts then Charge rules, with summary values", () => {
    render(
      <AcademicSectionFeesPanel
        dict={feesPanelDict}
        locale="en"
        sectionId={SECTION}
        asOfYear={2026}
        asOfMonth={7}
        feePlans={[plan]}
        feePlansDict={{ title: "Monthly fee plans", effectiveFromShort: "From" } as never}
        systemCurrency="CLP"
        enrollmentFeeAmount={50}
        storedEnrollmentFeeAmount={50}
        cohortDefaultEnrollmentFeeAmount={null}
        cohortDefaultMonthlyFee={null}
        enrollmentFeeDict={enrollmentFeeDict as never}
        chargeMode="prorate_by_classes"
        monthlyFeeChargeModeDict={monthlyFeeChargeModeDict as never}
        allowAdvance={false}
        allowAdvanceMonthlyPaymentDict={allowAdvanceDict as never}
      />,
    );

    expect(screen.getByLabelText(feesPanelDict.summary.title)).toBeInTheDocument();
    expect(screen.getByText("From 01/2026 · CLP 100.00")).toBeInTheDocument();
    expect(screen.getByText("CLP 50.00")).toBeInTheDocument();
    expect(screen.getByText(monthlyFeeChargeModeDict.optionProrate)).toBeInTheDocument();
    expect(screen.getByText(feesPanelDict.summary.advanceNo)).toBeInTheDocument();

    const amounts = screen.getByRole("heading", { name: feesPanelDict.amountsTitle });
    const rules = screen.getByRole("heading", { name: feesPanelDict.chargeRulesTitle });
    const summary = screen.getByLabelText(feesPanelDict.summary.title);
    expect(summary.compareDocumentPosition(amounts) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(amounts.compareDocumentPosition(rules) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(screen.getByRole("heading", { name: "Monthly fee plans" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: enrollmentFeeDict.title })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: monthlyFeeChargeModeDict.title }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: allowAdvanceDict.title })).toBeInTheDocument();
  });
});
