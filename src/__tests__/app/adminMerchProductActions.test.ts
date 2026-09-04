/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createShopProduct,
  upsertShopVariant,
  deleteShopVariant,
  toggleShopProductActive,
} from "@/app/[locale]/dashboard/admin/merch/actions";

const mockAssertAdmin = vi.fn();
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: vi.fn(),
}));

const adminUser = { id: "11111111-1111-1111-1111-111111111111" };
const PRODUCT_ID = "00000000-0000-4000-8000-000000000001";
const VARIANT_ID = "00000000-0000-4000-8000-000000000002";

const validProduct = { locale: "en", title: "Hoodie" };
const validVariant = {
  locale: "en",
  productId: PRODUCT_ID,
  size: "M",
  color: "Navy",
  sku: "HOODIE-M-NAVY",
  stock: 4,
  price: 19.9,
};

function insertReturningId(id: string) {
  const single = vi.fn().mockResolvedValue({ data: { id }, error: null });
  const select = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select });
  return { insert, select, single };
}

describe("createShopProduct", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns forbidden when assertAdmin throws", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("x"));
    const r = await createShopProduct(validProduct);
    expect(r).toEqual({ ok: false, code: "forbidden" });
  });

  it("rejects blank title", async () => {
    const r = await createShopProduct({ locale: "en", title: "  " });
    expect(r).toEqual({ ok: false, code: "invalid_input" });
  });

  it("inserts the product as inactive and returns id", async () => {
    const { insert } = insertReturningId(PRODUCT_ID);
    mockAssertAdmin.mockResolvedValue({
      user: adminUser,
      supabase: { from: vi.fn().mockReturnValue({ insert }) },
    });
    const r = await createShopProduct(validProduct);
    expect(r).toEqual({ ok: true, id: PRODUCT_ID });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Hoodie", active: false }),
    );
  });
});

describe("upsertShopVariant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns forbidden when assertAdmin throws", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("x"));
    const r = await upsertShopVariant(validVariant);
    expect(r).toEqual({ ok: false, code: "forbidden" });
  });

  it("rejects variant with stock < 0", async () => {
    const r = await upsertShopVariant({ ...validVariant, stock: -1 });
    expect(r).toEqual({ ok: false, code: "invalid_stock" });
  });

  it("rejects variant with price <= 0", async () => {
    const r = await upsertShopVariant({ ...validVariant, price: 0 });
    expect(r).toEqual({ ok: false, code: "invalid_price" });
  });

  it("returns duplicate_variant on unique violation", async () => {
    const single = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "23505", message: "duplicate key" },
    });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    mockAssertAdmin.mockResolvedValue({
      user: adminUser,
      supabase: { from: vi.fn().mockReturnValue({ insert }) },
    });
    const r = await upsertShopVariant(validVariant);
    expect(r).toEqual({ ok: false, code: "duplicate_variant" });
  });

  it("updates the existing row when id is provided", async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: VARIANT_ID }, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockReturnValue({ eq });
    const insert = vi.fn();
    mockAssertAdmin.mockResolvedValue({
      user: adminUser,
      supabase: { from: vi.fn().mockReturnValue({ update, insert }) },
    });
    const r = await upsertShopVariant({
      ...validVariant,
      id: VARIANT_ID,
      stock: 8,
      price: 24.9,
      active: true,
    });
    expect(r).toEqual({ ok: true, id: VARIANT_ID });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ stock: 8, price: 24.9, active: true }),
    );
    expect(eq).toHaveBeenCalledWith("id", VARIANT_ID);
    expect(insert).not.toHaveBeenCalled();
  });
});

describe("deleteShopVariant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns forbidden when assertAdmin throws", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("x"));
    const r = await deleteShopVariant({ locale: "en", id: VARIANT_ID });
    expect(r).toEqual({ ok: false, code: "forbidden" });
  });

  it("rejects delete when the variant appears on shop_order_items", async () => {
    const deleteEq = vi.fn();
    const orderMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: "item-1" },
      error: null,
    });
    const from = vi.fn((table: string) => {
      if (table === "shop_order_items") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({ maybeSingle: orderMaybeSingle }),
            }),
          }),
        };
      }
      return { delete: vi.fn().mockReturnValue({ eq: deleteEq }) };
    });
    mockAssertAdmin.mockResolvedValue({
      user: adminUser,
      supabase: { from },
    });
    const r = await deleteShopVariant({ locale: "en", id: VARIANT_ID });
    expect(r).toEqual({ ok: false, code: "archive_only" });
    expect(deleteEq).not.toHaveBeenCalled();
  });
});

describe("toggleShopProductActive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects activate when the product has no variants", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const from = vi.fn((table: string) => {
      if (table === "shop_product_variants") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({ maybeSingle }),
            }),
          }),
        };
      }
      return { update: vi.fn() };
    });
    mockAssertAdmin.mockResolvedValue({
      user: adminUser,
      supabase: { from },
    });
    const r = await toggleShopProductActive({
      locale: "en",
      id: PRODUCT_ID,
      active: true,
    });
    expect(r).toEqual({ ok: false, code: "no_variants" });
  });
});
