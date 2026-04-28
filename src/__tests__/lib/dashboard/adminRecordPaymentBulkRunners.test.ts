import { describe, expect, it, vi } from "vitest";
import {
  formatMonthFailureLine,
  runRecordPaymentExemptBulk,
  runRecordPaymentPaidBulk,
  runRecordPaymentScholarshipBulk,
} from "@/lib/dashboard/adminRecordPaymentBulkRunners";
import { dictEn } from "@/test/dictEn";

vi.mock("@/app/[locale]/dashboard/admin/payments/recordPaymentWithoutReceiptAction", () => ({
  recordPaymentsWithoutReceiptBulk: vi.fn(),
}));
vi.mock("@/app/[locale]/dashboard/admin/users/[userId]/billing/periodExemptionActions", () => ({
  setPeriodExemption: vi.fn(),
}));
vi.mock("@/app/[locale]/dashboard/admin/users/[userId]/billing/upsertStudentScholarship", () => ({
  createStudentScholarship: vi.fn(),
}));

import { recordPaymentsWithoutReceiptBulk } from "@/app/[locale]/dashboard/admin/payments/recordPaymentWithoutReceiptAction";
import { setPeriodExemption } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/periodExemptionActions";
import { createStudentScholarship } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/upsertStudentScholarship";

const labels = dictEn.admin.billing;

describe("adminRecordPaymentBulkRunners", () => {
  it("formatMonthFailureLine includes month and message", () => {
    const s = formatMonthFailureLine("en", 3, "x");
    expect(s).toContain("03");
    expect(s).toContain("x");
  });

  it("runRecordPaymentPaidBulk forwards to action", async () => {
    vi.mocked(recordPaymentsWithoutReceiptBulk).mockResolvedValueOnce({
      ok: true,
      recorded: 1,
      results: [{ month: 1, ok: true }],
      batchId: "b1",
    });
    const r = await runRecordPaymentPaidBulk({
      studentId: "a",
      sectionId: "b",
      year: 2026,
      months: [1],
      locale: "es",
      labels,
    });
    expect(r.ok).toBe(true);
  });

  it("runRecordPaymentExemptBulk aggregates failures", async () => {
    vi.mocked(setPeriodExemption)
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false, message: "nope" });
    const r = await runRecordPaymentExemptBulk({
      locale: "es",
      studentId: "a",
      sectionId: "b",
      year: 2026,
      months: [1, 2],
      adminNote: "note",
      labels,
    });
    expect(r.ok).toBe(true);
    expect(r.message).toContain("1");
  });

  it("runRecordPaymentScholarshipBulk handles all ok", async () => {
    vi.mocked(createStudentScholarship).mockResolvedValue({ ok: true });
    const r = await runRecordPaymentScholarshipBulk({
      locale: "es",
      studentId: "a",
      sectionId: "b",
      year: 2026,
      months: [4],
      discountPercent: 10,
      labels,
    });
    expect(r.ok).toBe(true);
  });
});
