/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import es from "@/dictionaries/es.json";
import {
  bulkApproveBillingReceipts,
  bulkRejectBillingReceipts,
} from "@/app/[locale]/dashboard/admin/finance/receipts/actions";

const BR = es.actionErrors.billingReview;

const mockAssertAdmin = vi.fn();
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

describe("bulkApproveBillingReceipts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns invalid data when receiptIds is empty", async () => {
    mockAssertAdmin.mockResolvedValue({});
    const r = await bulkApproveBillingReceipts({ receiptIds: [], locale: "en" });
    expect(r).toEqual({
      ok: false,
      processed: 0,
      message: BR.invalidData,
    });
  });

  it("returns forbidden when assertAdmin fails before processing", async () => {
    mockAssertAdmin.mockRejectedValueOnce(new Error("no"));
    const r = await bulkApproveBillingReceipts({
      receiptIds: ["00000000-0000-4000-8000-000000000099"],
      locale: "en",
    });
    expect(r).toEqual({
      ok: false,
      processed: 0,
      message: BR.forbidden,
    });
  });
});

describe("bulkRejectBillingReceipts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns invalid data when receiptIds is empty", async () => {
    mockAssertAdmin.mockResolvedValue({});
    const r = await bulkRejectBillingReceipts({
      receiptIds: [],
      locale: "en",
      code: "other",
    });
    expect(r).toEqual({
      ok: false,
      processed: 0,
      message: BR.invalidData,
    });
  });

  it("returns forbidden when assertAdmin fails before processing", async () => {
    mockAssertAdmin.mockRejectedValueOnce(new Error("no"));
    const r = await bulkRejectBillingReceipts({
      receiptIds: ["00000000-0000-4000-8000-000000000099"],
      locale: "en",
      code: "other",
    });
    expect(r).toEqual({
      ok: false,
      processed: 0,
      message: BR.forbidden,
    });
  });
});
