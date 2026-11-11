import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { AdminStudentBillingClient } from "@/components/dashboard/AdminStudentBillingClient";
import { dictEn } from "@/test/dictEn";
import type { AdminStudentBillingTabData } from "@/types/adminStudentBilling";

vi.mock("next/navigation", () => ({
  usePathname: () => "/es",
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const billing: AdminStudentBillingTabData = {
  payments: [],
  scholarships: [],
  sectionBenefits: [
    {
      enrollmentId: "enr-1",
      sectionId: "00000000-0000-4000-8000-000000000001",
      sectionName: "Section A",
      sectionEnrollmentFeeAmount: 0,
      sectionMonthlyFeeAmount: null,
      sectionMonthlyFeeCurrency: null,
      sectionStartsOn: "2026-01-01",
      sectionEndsOn: "2026-12-31",
      enrollmentCreatedAt: "2026-01-10T00:00:00Z",
      enrollmentFeeExempt: true,
      enrollmentExemptReason: "Manual approval",
      lastEnrollmentPaidAt: null,
      scholarships: [],
      enrollmentFeeReceiptSignedUrl: null,
      enrollmentFeeReceiptStatus: null,
      feePlans: [],
      scheduleSlots: [],
      cohortName: "",
      annualSettlements: [],
    },
    {
      enrollmentId: "enr-2",
      sectionId: "00000000-0000-4000-8000-000000000002",
      sectionName: "Section B",
      sectionEnrollmentFeeAmount: 50,
      sectionMonthlyFeeAmount: 120,
      sectionMonthlyFeeCurrency: "USD",
      sectionStartsOn: "2026-01-01",
      sectionEndsOn: "2026-12-31",
      enrollmentCreatedAt: "2026-02-01T00:00:00Z",
      enrollmentFeeExempt: false,
      enrollmentExemptReason: null,
      lastEnrollmentPaidAt: null,
      scholarships: [],
      enrollmentFeeReceiptSignedUrl: null,
      enrollmentFeeReceiptStatus: null,
      feePlans: [],
      scheduleSlots: [],
      cohortName: "",
      annualSettlements: [],
    },
  ],
  enrollmentFeeExempt: false,
  enrollmentExemptReason: null,
  lastEnrollmentPaidAt: null,
};

function renderBillingClient(
  override?: Partial<ComponentProps<typeof AdminStudentBillingClient>>,
) {
  return render(
    <AdminStudentBillingClient
      locale="en"
      studentId="00000000-0000-4000-8000-000000000099"
      studentName="Ana Student"
      payments={billing.payments}
      scholarships={billing.scholarships}
      sectionBenefits={billing.sectionBenefits}
      labels={dictEn.admin.billing}
      enrollmentFeeExempt={billing.enrollmentFeeExempt}
      enrollmentExemptReason={billing.enrollmentExemptReason}
      lastEnrollmentPaidAt={billing.lastEnrollmentPaidAt}
      defaultYear={2026}
      {...override}
    />,
  );
}

const billedSectionWithScholarship = (
  discountPercent: number,
): AdminStudentBillingTabData["sectionBenefits"][number] => ({
  ...billing.sectionBenefits[1]!,
  sectionId: "00000000-0000-4000-8000-000000000002",
  sectionName: "Section B",
  sectionMonthlyFeeAmount: 120,
  sectionMonthlyFeeCurrency: "USD",
  enrollmentCreatedAt: "2026-01-01T00:00:00Z",
  feePlans: [
    {
      id: "plan-b",
      sectionId: "00000000-0000-4000-8000-000000000002",
      effectiveFromYear: 2026,
      effectiveFromMonth: 1,
      monthlyFee: 120,
      currency: "USD",
      archivedAt: null,
    },
  ],
  scholarships: [
    {
      id: "00000000-0000-4000-8000-000000000010",
      discount_percent: discountPercent,
      note: null,
      valid_from_year: 2026,
      valid_from_month: 1,
      valid_until_year: 2026,
      valid_until_month: 12,
      is_active: true,
    },
  ],
});

describe("AdminStudentBillingClient", () => {
  it("strikes the list monthly fee and shows the scholarship average", () => {
    renderBillingClient({
      sectionBenefits: [billedSectionWithScholarship(50)],
    });

    expect(screen.getByRole("deletion")).toHaveTextContent("$120");
    expect(
      screen.getByRole("region", { name: dictEn.admin.billing.billingPersonMonthlyTotalLabel }),
    ).toHaveTextContent("$60");
    expect(screen.getAllByText("$60").length).toBeGreaterThanOrEqual(1);
  });

  it("shows a $0 monthly fee when every billable month is a 100% scholarship", () => {
    renderBillingClient({
      sectionBenefits: [billedSectionWithScholarship(100)],
    });

    expect(screen.getByRole("deletion")).toHaveTextContent("$120");
    expect(
      screen.getByRole("region", { name: dictEn.admin.billing.billingPersonMonthlyTotalLabel }),
    ).toHaveTextContent("$0");
  });

  it("shows the person monthly total above the section picker", () => {
    renderBillingClient({
      sectionBenefits: [
        billedSectionWithScholarship(50),
        {
          ...billedSectionWithScholarship(0),
          enrollmentId: "enr-3",
          sectionId: "00000000-0000-4000-8000-000000000003",
          sectionName: "Section C",
          sectionMonthlyFeeAmount: 80,
          scholarships: [],
        },
      ],
    });

    expect(
      screen.getByRole("region", { name: dictEn.admin.billing.billingPersonMonthlyTotalLabel }),
    ).toHaveTextContent("$140");
  });

  it("renders the section selector, monthly matrix and tabs without redundant toolbar buttons", () => {
    renderBillingClient();

    expect(
      screen.getByLabelText(dictEn.admin.billing.sectionBenefitSelect),
    ).toBeEnabled();
    expect(screen.getByText("Section A")).toBeInTheDocument();
    expect(screen.getByText(dictEn.admin.billing.recordPaymentMatrixTitle)).toBeInTheDocument();

    const tablist = screen.getByRole("tablist", {
      name: dictEn.admin.billing.tabsAria,
    });
    expect(within(tablist).getByRole("tab", { name: dictEn.admin.billing.tabHistory })).toBeInTheDocument();
    expect(
      within(tablist).getByRole("tab", { name: dictEn.admin.billing.tabScholarships }),
    ).toBeInTheDocument();
    expect(
      within(tablist).getByRole("tab", { name: dictEn.admin.billing.tabEnrollment }),
    ).toBeInTheDocument();
  });

  it("shows payment history with scholarship column inside the History tab", async () => {
    const user = userEvent.setup();
    renderBillingClient({
      payments: [
        {
          id: "pay-apr",
          month: 4,
          year: 2026,
          amount: 100,
          status: "pending",
          section_id: "00000000-0000-4000-8000-000000000001",
          admin_notes: null,
          updated_at: "2026-04-01T00:00:00Z",
          receiptSignedUrl: null,
        },
        {
          id: "pay-may",
          month: 5,
          year: 2026,
          amount: 50,
          status: "pending",
          section_id: "00000000-0000-4000-8000-000000000001",
          admin_notes: null,
          updated_at: "2026-05-01T00:00:00Z",
          receiptSignedUrl: null,
        },
      ],
      sectionBenefits: [
        {
          ...billing.sectionBenefits[0]!,
          scholarships: [
            {
              id: "00000000-0000-4000-8000-000000000010",
              discount_percent: 50,
              note: null,
              valid_from_year: 2026,
              valid_from_month: 5,
              valid_until_year: 2026,
              valid_until_month: 7,
              is_active: true,
            },
          ],
        },
      ],
    });

    const historyTab = screen.getByRole("tab", { name: dictEn.admin.billing.tabHistory });
    await user.click(historyTab);

    const historyPanel = screen.getByRole("tabpanel", { hidden: false });
    expect(
      within(historyPanel).getByRole("columnheader", {
        name: new RegExp(dictEn.admin.billing.colScholarship),
      }),
    ).toBeInTheDocument();
    expect(within(historyPanel).getByText("50% discount")).toBeInTheDocument();
    expect(within(historyPanel).getByText("04/2026")).toBeInTheDocument();
    expect(within(historyPanel).getByText("05/2026")).toBeInTheDocument();
  });

  it("lists only the selected cohort in the section selector", async () => {
    const user = userEvent.setup();
    const benefits = [
      { ...billing.sectionBenefits[0]!, cohortId: "cohort-now", enrollmentStatus: "active" as const },
      { ...billing.sectionBenefits[1]!, cohortId: "cohort-past", enrollmentStatus: "completed" as const },
    ];
    const options = [
      { id: "cohort-now", name: "2026", isCurrent: true, latestEnrollmentAt: "2026-01-10T00:00:00Z" },
      { id: "cohort-past", name: "2024", isCurrent: false, latestEnrollmentAt: "2024-01-10T00:00:00Z" },
    ];

    function CohortBilling() {
      const [cohortId, setCohortId] = useState("cohort-now");
      return (
        <AdminStudentBillingClient
          locale="en"
          studentId="00000000-0000-4000-8000-000000000099"
          studentName="Ana Student"
          payments={[]}
          scholarships={[]}
          sectionBenefits={benefits}
          labels={dictEn.admin.billing}
          enrollmentFeeExempt={false}
          enrollmentExemptReason={null}
          lastEnrollmentPaidAt={null}
          defaultYear={2026}
          cohortOptions={options}
          selectedCohortId={cohortId}
          onCohortChange={setCohortId}
        />
      );
    }

    render(<CohortBilling />);

    const sectionSelect = screen.getByLabelText(dictEn.admin.billing.sectionBenefitSelect);
    expect(within(sectionSelect).getByRole("option", { name: "Section A" })).toBeInTheDocument();
    expect(within(sectionSelect).queryByRole("option", { name: "Section B" })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(dictEn.admin.billing.cohortSelect), "cohort-past");

    expect(within(sectionSelect).getByRole("option", { name: "Section B" })).toBeInTheDocument();
    expect(within(sectionSelect).queryByRole("option", { name: "Section A" })).not.toBeInTheDocument();
  });

  it("shows the empty state when there are no payments yet for the section", async () => {
    const user = userEvent.setup();
    renderBillingClient();

    const historyTab = screen.getByRole("tab", { name: dictEn.admin.billing.tabHistory });
    await user.click(historyTab);

    expect(screen.getByText(dictEn.admin.billing.tabHistoryEmpty)).toBeInTheDocument();
  });
});
