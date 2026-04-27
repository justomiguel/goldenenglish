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

const adminUser = { id: "11111111-1111-1111-1111-111111111111" };

function supabaseForReviewPayment(updateError: unknown | null) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: {
      id: "00000000-0000-4000-8000-000000000002",
      student_id: null,
      parent_id: null,
      month: 1,
      year: 2026,
      amount: 100,
      status: "pending",
      admin_notes: null,
    },
    error: null,
  });
  const eqUpdate = vi.fn().mockResolvedValue({ error: updateError });
  const from = vi.fn(() => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle,
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: eqUpdate,
    }),
  }));
  return { from, eqUpdate, maybeSingle };
}

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
    mockAssertAdmin.mockResolvedValue({ supabase: {}, user: adminUser });
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
    const { from } = supabaseForReviewPayment({ message: "db" });
    mockAssertAdmin.mockResolvedValue({ supabase: { from }, user: adminUser });
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
    const { from, maybeSingle } = supabaseForReviewPayment(null);
    maybeSingle.mockResolvedValue({
      data: {
        id: "00000000-0000-4000-8000-000000000003",
        student_id: null,
        parent_id: null,
        month: 2,
        year: 2026,
        amount: 50,
        status: "pending",
        admin_notes: null,
      },
      error: null,
    });
    mockAssertAdmin.mockResolvedValue({ supabase: { from }, user: adminUser });
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
