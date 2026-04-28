import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { AdminStudentBillingClient } from "@/components/dashboard/AdminStudentBillingClient";
import { dictEn } from "@/test/dictEn";
import type { AdminStudentBillingTabData } from "@/types/adminStudentBilling";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
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

describe("AdminStudentBillingClient", () => {
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
        name: dictEn.admin.billing.colScholarship,
      }),
    ).toBeInTheDocument();
    expect(within(historyPanel).getByText("50% discount")).toBeInTheDocument();
    expect(within(historyPanel).getByText("04/2026")).toBeInTheDocument();
    expect(within(historyPanel).getByText("05/2026")).toBeInTheDocument();
  });

  it("shows the empty state when there are no payments yet for the section", async () => {
    const user = userEvent.setup();
    renderBillingClient();

    const historyTab = screen.getByRole("tab", { name: dictEn.admin.billing.tabHistory });
    await user.click(historyTab);

    expect(screen.getByText(dictEn.admin.billing.tabHistoryEmpty)).toBeInTheDocument();
  });
});
