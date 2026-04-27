/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createDiscountCoupon,
  toggleDiscountCoupon,
} from "@/app/[locale]/dashboard/admin/coupons/actions";
import { dictEn } from "@/test/dictEn";

const mockAssertAdmin = vi.fn();
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const ae = dictEn.actionErrors.admin;

const adminUser = { id: "11111111-1111-1111-1111-111111111111" };

describe("createDiscountCoupon", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid payload", async () => {
    const r = await createDiscountCoupon({
      locale: "en",
      code: "x",
      discountType: "percent",
      discountValue: -1,
    } as never);
    expect(r).toEqual({ ok: false, message: ae.invalidData });
  });

  it("rejects percent over 100", async () => {
    const r = await createDiscountCoupon({
      locale: "en",
      code: "SAVE",
      discountType: "percent",
      discountValue: 101,
    });
    expect(r).toEqual({ ok: false, message: ae.percentOver100 });
  });

  it("rejects blank trimmed code", async () => {
    const r = await createDiscountCoupon({
      locale: "en",
      code: "   ",
      discountType: "fixed_amount",
      discountValue: 10,
    });
    expect(r).toEqual({ ok: false, message: ae.invalidCode });
  });

  it("returns forbidden when assertAdmin throws", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("x"));
    const r = await createDiscountCoupon({
      locale: "en",
      code: "OK10",
      discountType: "fixed_amount",
      discountValue: 10,
    });
    expect(r).toEqual({ ok: false, message: ae.forbidden });
  });

  it("returns saveFailed on insert error", async () => {
    const insert = vi.fn().mockResolvedValue({ error: { message: "dup" } });
    mockAssertAdmin.mockResolvedValue({
      user: adminUser,
      supabase: { from: vi.fn().mockReturnValue({ insert }) },
    });
    const r = await createDiscountCoupon({
      locale: "en",
      code: "SAVE10",
      discountType: "percent",
      discountValue: 5,
    });
    expect(r).toEqual({ ok: false, message: ae.saveFailed });
  });

  it("returns ok and uses trimmed code", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockAssertAdmin.mockResolvedValue({
      user: adminUser,
      supabase: { from: vi.fn().mockReturnValue({ insert }) },
    });
    const r = await createDiscountCoupon({
      locale: "en",
      code: "  trim  ",
      discountType: "fixed_amount",
      discountValue: 12,
      validUntil: "",
      maxUses: null,
    });
    expect(r).toEqual({ ok: true });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ code: "trim", max_uses: null }),
    );
  });
});

describe("toggleDiscountCoupon", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid uuid", async () => {
    const r = await toggleDiscountCoupon("en", "bad", true);
    expect(r).toEqual({ ok: false, message: ae.invalidId });
  });

  it("returns forbidden when assertAdmin throws", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("x"));
    const r = await toggleDiscountCoupon(
      "en",
      "00000000-0000-4000-8000-000000000001",
      false,
    );
    expect(r).toEqual({ ok: false, message: ae.forbidden });
  });

  it("returns saveFailed on update error", async () => {
    const eqUpdate = vi.fn().mockResolvedValue({ error: { message: "x" } });
    const update = vi.fn().mockReturnValue({ eq: eqUpdate });
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "00000000-0000-4000-8000-000000000002", code: "C2", is_active: true },
      error: null,
    });
    const from = vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ maybeSingle }),
      }),
      update,
    }));
    mockAssertAdmin.mockResolvedValue({
      user: adminUser,
      supabase: { from },
    });
    const r = await toggleDiscountCoupon(
      "en",
      "00000000-0000-4000-8000-000000000002",
      true,
    );
    expect(r).toEqual({ ok: false, message: ae.saveFailed });
  });

  it("returns ok on success", async () => {
    const eqUpdate = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq: eqUpdate });
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "00000000-0000-4000-8000-000000000003", code: "C3", is_active: true },
      error: null,
    });
    const from = vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ maybeSingle }),
      }),
      update,
    }));
    mockAssertAdmin.mockResolvedValue({
      user: adminUser,
      supabase: { from },
    });
    const r = await toggleDiscountCoupon(
      "en",
      "00000000-0000-4000-8000-000000000003",
      false,
    );
    expect(r).toEqual({ ok: true });
  });
});
