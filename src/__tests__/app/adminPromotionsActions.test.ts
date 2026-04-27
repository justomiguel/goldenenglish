/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createPromotion,
  togglePromotionActive,
  softDeletePromotion,
} from "@/app/[locale]/dashboard/admin/promotions/actions";
import { dictEn } from "@/test/dictEn";

const mockAssertAdmin = vi.fn();
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const ae = dictEn.actionErrors.admin;

const adminUser = { id: "11111111-1111-1111-1111-111111111111" };

const validBase = {
  locale: "en",
  code: "PROMO",
  name: "Spring",
  discountType: "fixed_amount" as const,
  discountValue: 15,
  appliesTo: "enrollment" as const,
  isStackable: false,
};

describe("createPromotion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid payload", async () => {
    const r = await createPromotion({ ...validBase, discountValue: 0 });
    expect(r).toEqual({ ok: false, message: ae.invalidData });
  });

  it("rejects percent over 100", async () => {
    const r = await createPromotion({
      ...validBase,
      discountType: "percent",
      discountValue: 150,
    });
    expect(r).toEqual({ ok: false, message: ae.percentOver100 });
  });

  it("rejects blank code after trim", async () => {
    const r = await createPromotion({ ...validBase, code: "  " });
    expect(r).toEqual({ ok: false, message: ae.invalidCode });
  });

  it("returns forbidden when assertAdmin throws", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("x"));
    const r = await createPromotion(validBase);
    expect(r).toEqual({ ok: false, message: ae.forbidden });
  });

  it("returns saveFailed on insert error", async () => {
    const insert = vi.fn().mockResolvedValue({ error: { message: "x" } });
    mockAssertAdmin.mockResolvedValue({
      user: adminUser,
      supabase: { from: vi.fn().mockReturnValue({ insert }) },
    });
    const r = await createPromotion({
      ...validBase,
      appliesTo: "monthly",
      monthlyDurationMonths: 3,
    });
    expect(r).toEqual({ ok: false, message: ae.saveFailed });
  });

  it("returns ok with monthly applies and null duration", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    mockAssertAdmin.mockResolvedValue({
      user: adminUser,
      supabase: { from: vi.fn().mockReturnValue({ insert }) },
    });
    const r = await createPromotion({
      ...validBase,
      appliesTo: "both",
      monthlyDurationMonths: undefined,
      expiresAt: "",
    });
    expect(r).toEqual({ ok: true });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        monthly_duration_months: null,
        expires_at: null,
      }),
    );
  });
});

describe("togglePromotionActive", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects invalid id", async () => {
    const r = await togglePromotionActive("en", "nope", true);
    expect(r).toEqual({ ok: false, message: ae.invalidId });
  });

  it("returns saveFailed on update error", async () => {
    const is = vi.fn().mockResolvedValue({ error: { message: "x" } });
    const eq = vi.fn().mockReturnValue({ is });
    const update = vi.fn().mockReturnValue({ eq });
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "00000000-0000-4000-8000-000000000001",
        code: "P1",
        name: "N1",
        is_active: true,
      },
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
    const r = await togglePromotionActive(
      "en",
      "00000000-0000-4000-8000-000000000001",
      false,
    );
    expect(r).toEqual({ ok: false, message: ae.saveFailed });
    expect(eq).toHaveBeenCalled();
  });

  it("returns ok", async () => {
    const is = vi.fn().mockResolvedValue({ error: null });
    const eq = vi.fn().mockReturnValue({ is });
    const update = vi.fn().mockReturnValue({ eq });
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "00000000-0000-4000-8000-000000000002",
        code: "P2",
        name: "N2",
        is_active: false,
      },
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
    const r = await togglePromotionActive(
      "en",
      "00000000-0000-4000-8000-000000000002",
      true,
    );
    expect(r).toEqual({ ok: true });
  });
});

describe("softDeletePromotion", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects invalid id", async () => {
    const r = await softDeletePromotion("en", "bad");
    expect(r).toEqual({ ok: false, message: ae.invalidId });
  });

  it("returns saveFailed on update error", async () => {
    const eqUpdate = vi.fn().mockResolvedValue({ error: { message: "x" } });
    const update = vi.fn().mockReturnValue({ eq: eqUpdate });
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "00000000-0000-4000-8000-000000000003",
        code: "P3",
        name: "N3",
        is_active: true,
        deleted_at: null,
      },
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
    const r = await softDeletePromotion(
      "en",
      "00000000-0000-4000-8000-000000000003",
    );
    expect(r).toEqual({ ok: false, message: ae.saveFailed });
  });

  it("returns ok", async () => {
    const eqUpdate = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq: eqUpdate });
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "00000000-0000-4000-8000-000000000004",
        code: "P4",
        name: "N4",
        is_active: true,
        deleted_at: null,
      },
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
    const r = await softDeletePromotion(
      "en",
      "00000000-0000-4000-8000-000000000004",
    );
    expect(r).toEqual({ ok: true });
  });
});
