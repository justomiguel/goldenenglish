import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  reviewPayment,
  getReceiptSignedUrl,
} from "@/app/[locale]/dashboard/admin/payments/actions";
import esDict from "@/dictionaries/es.json";

const mockAssertAdmin = vi.fn();
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

const mockCreateAdminClient = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockCreateAdminClient(),
}));

describe("reviewPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns Forbidden when assertAdmin fails", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("no"));
    const r = await reviewPayment({
      paymentId: "00000000-0000-4000-8000-000000000001",
      status: "approved",
    });
    expect(r).toEqual({
      ok: false,
      message: esDict.actionErrors.paymentsReview.forbidden,
    });
  });

  it("returns Invalid data for bad payload", async () => {
    mockAssertAdmin.mockResolvedValue({ supabase: {} });
    const r = await reviewPayment({
      paymentId: "not-a-uuid",
      status: "approved",
    });
    expect(r).toEqual({
      ok: false,
      message: esDict.actionErrors.paymentsReview.invalidData,
    });
  });

  it("surfaces update errors", async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: "db" } });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });
    const r = await reviewPayment({
      paymentId: "00000000-0000-4000-8000-000000000002",
      status: "rejected",
      locale: "es",
    });
    expect(r).toEqual({
      ok: false,
      message: esDict.actionErrors.paymentsReview.saveFailed,
    });
  });

  it("returns ok on success", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });
    const r = await reviewPayment({
      paymentId: "00000000-0000-4000-8000-000000000003",
      status: "approved",
      locale: "es",
    });
    expect(r).toEqual({ ok: true });
  });
});

describe("getReceiptSignedUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when admin check fails", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("no"));
    expect(await getReceiptSignedUrl("p/a.pdf")).toBeNull();
  });

  it("returns null when path empty after trim", async () => {
    mockAssertAdmin.mockResolvedValue({});
    expect(await getReceiptSignedUrl("  ")).toBeNull();
  });

  it("returns null when path contains ..", async () => {
    mockAssertAdmin.mockResolvedValue({});
    expect(await getReceiptSignedUrl("a/../b")).toBeNull();
  });

  it("returns null when storage returns no URL", async () => {
    mockAssertAdmin.mockResolvedValue({});
    const createSignedUrl = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "fail" },
    });
    mockCreateAdminClient.mockReturnValue({
      storage: { from: () => ({ createSignedUrl }) },
    });
    expect(await getReceiptSignedUrl("safe.pdf")).toBeNull();
  });

  it("returns signed URL string", async () => {
    mockAssertAdmin.mockResolvedValue({});
    const createSignedUrl = vi.fn().mockResolvedValue({
      data: { signedUrl: "https://sig/u" },
      error: null,
    });
    mockCreateAdminClient.mockReturnValue({
      storage: { from: () => ({ createSignedUrl }) },
    });
    expect(await getReceiptSignedUrl("safe.pdf")).toBe("https://sig/u");
  });
});
