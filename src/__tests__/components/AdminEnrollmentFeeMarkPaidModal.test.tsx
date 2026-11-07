import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminEnrollmentFeeMarkPaidModal } from "@/components/dashboard/AdminEnrollmentFeeMarkPaidModal";
import dict from "@/dictionaries/en.json";

vi.mock("@/app/[locale]/dashboard/admin/users/[userId]/billing/enrollmentFeeActions", () => ({
  markEnrollmentFeePaidNow: vi.fn(),
}));

const labels = dict.admin.billing;

describe("AdminEnrollmentFeeMarkPaidModal", () => {
  it("opens with cash selected", () => {
    render(
      <AdminEnrollmentFeeMarkPaidModal
        open
        onOpenChange={() => undefined}
        locale="en"
        studentId="00000000-0000-4000-8000-000000000001"
        sectionId="00000000-0000-4000-8000-000000000002"
        labels={labels}
      />,
    );
    expect(screen.getByLabelText(labels.paymentMethodLabel)).toHaveValue("cash");
    expect(screen.getByRole("button", { name: labels.enrollmentMarkPaid })).toBeEnabled();
  });
});
