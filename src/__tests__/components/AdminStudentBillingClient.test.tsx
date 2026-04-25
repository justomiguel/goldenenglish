import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminStudentBillingClient } from "@/components/dashboard/AdminStudentBillingClient";
import { dictEn } from "@/test/dictEn";
import type { AdminStudentBillingTabData } from "@/types/adminStudentBilling";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const billing: AdminStudentBillingTabData = {
  payments: [],
  scholarships: [],
  sectionBenefits: [
    {
      enrollmentId: "enr-1",
      sectionId: "00000000-0000-4000-8000-000000000001",
      sectionName: "Section A",
      enrollmentFeeExempt: true,
      enrollmentExemptReason: "Manual approval",
      lastEnrollmentPaidAt: null,
      scholarships: [],
    },
    {
      enrollmentId: "enr-2",
      sectionId: "00000000-0000-4000-8000-000000000002",
      sectionName: "Section B",
      enrollmentFeeExempt: false,
      enrollmentExemptReason: null,
      lastEnrollmentPaidAt: null,
      scholarships: [],
    },
  ],
  enrollmentFeeExempt: false,
  enrollmentExemptReason: null,
  lastEnrollmentPaidAt: null,
};

describe("AdminStudentBillingClient", () => {
  it("shows which section owns an existing enrollment exemption", () => {
    render(
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
      />,
    );

    expect(
      screen.getByLabelText(dictEn.admin.billing.sectionBenefitSelect),
    ).toBeEnabled();
    expect(screen.getByText("Section A · enrollment exempt")).toBeInTheDocument();
    expect(screen.getByText("Enrollment fee exempt in: Section A")).toBeInTheDocument();
    expect(screen.getByText("Editing enrollment fee for: Section A")).toBeInTheDocument();
  });

  it("marks only scholarship-covered months in the payment periods table", () => {
    render(
      <AdminStudentBillingClient
        locale="en"
        studentId="00000000-0000-4000-8000-000000000099"
        studentName="Ana Student"
        payments={[
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
        ]}
        scholarships={[]}
        sectionBenefits={[
          {
            ...billing.sectionBenefits[0]!,
            scholarships: [{
              id: "00000000-0000-4000-8000-000000000010",
              discount_percent: 50,
              note: null,
              valid_from_year: 2026,
              valid_from_month: 5,
              valid_until_year: 2026,
              valid_until_month: 7,
              is_active: true,
            }],
          },
        ]}
        labels={dictEn.admin.billing}
        enrollmentFeeExempt={false}
        enrollmentExemptReason={null}
        lastEnrollmentPaidAt={null}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Scholarship" })).toBeInTheDocument();
    expect(screen.getByText("50% discount")).toBeInTheDocument();
    expect(screen.getByText("04/2026")).toBeInTheDocument();
    expect(screen.getAllByText("05/2026").length).toBeGreaterThanOrEqual(1);
  });
});
