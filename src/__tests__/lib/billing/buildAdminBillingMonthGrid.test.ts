import { describe, expect, it } from "vitest";
import { buildAdminBillingMonthGrid } from "@/lib/billing/buildAdminBillingMonthGrid";
import type {
  AdminBillingPaymentRow,
  AdminBillingScholarship,
} from "@/types/adminStudentBilling";

const SECTION_ID = "00000000-0000-4000-8000-000000000001";

function payment(
  month: number,
  status: string,
  section_id: string | null = SECTION_ID,
): AdminBillingPaymentRow {
  return {
    id: `pay-${month}-${status}`,
    month,
    year: 2026,
    amount: 100,
    status,
    section_id,
    admin_notes: null,
    updated_at: "2026-01-01T00:00:00Z",
    receiptSignedUrl: null,
  };
}

const scholarship: AdminBillingScholarship = {
  id: "00000000-0000-4000-8000-000000000010",
  discount_percent: 50,
  note: null,
  valid_from_year: 2026,
  valid_from_month: 5,
  valid_until_year: 2026,
  valid_until_month: 6,
  is_active: true,
};

describe("buildAdminBillingMonthGrid", () => {
  it("marks paid and exempt periods as read-only and shows scholarship months", () => {
    const rows = buildAdminBillingMonthGrid({
      payments: [payment(4, "approved"), payment(5, "exempt")],
      scholarships: [scholarship],
      sectionId: SECTION_ID,
      year: 2026,
    });

    expect(rows[3]).toMatchObject({ month: 4, status: "paid", selectable: false });
    expect(rows[4]).toMatchObject({
      month: 5,
      status: "exempt",
      selectable: false,
      scholarshipPercent: 50,
    });
    expect(rows[5]).toMatchObject({
      month: 6,
      status: "unpaid",
      selectable: true,
      scholarshipPercent: 50,
    });
  });

  it("ignores legacy no-section rows for matrix status (Finance parity) but blocks recording", () => {
    const rows = buildAdminBillingMonthGrid({
      payments: [payment(7, "pending", null)],
      scholarships: [],
      sectionId: SECTION_ID,
      year: 2026,
    });

    expect(rows[6]).toMatchObject({
      month: 7,
      status: "unpaid",
      paymentId: null,
      selectable: false,
      legacyFallback: true,
    });
  });
});
