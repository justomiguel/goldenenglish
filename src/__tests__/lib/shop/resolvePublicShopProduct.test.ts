/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { resolvePublicShopProduct } from "@/lib/shop/loadPublicCatalog";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/shop/shopMedia", () => ({
  shopProductImagePublicUrl: (path: string | null | undefined) =>
    path ? `https://cdn.test/${path}` : null,
}));

const HOODIE_ID = "123e4567-e89b-12d3-a456-426614174000";

const hoodie = {
  id: HOODIE_ID,
  slug: "hoodie",
  title: "Hoodie",
  description: "Warm",
  image_path: "products/hoodie.jpg",
  active: true,
  shop_product_variants: [
    { id: "buyable", active: true, stock: 2, price: 20, size: "M", color: "Navy" },
  ],
};

function queuedClient(results: Array<{ data: unknown; error: unknown }>) {
  const queue = [...results];
  const chain = {
    select: () => chain,
    eq: () => chain,
    maybeSingle: async () => queue.shift() ?? { data: null, error: null },
  };
  return { from: () => chain };
}

describe("resolvePublicShopProduct", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset();
  });

  it("returns null for a blank key", async () => {
    await expect(resolvePublicShopProduct("  ")).resolves.toBeNull();
  });

  it("loads a product by id and keeps the slug", async () => {
    vi.mocked(createClient).mockResolvedValue(queuedClient([{ data: hoodie, error: null }]) as never);
    const found = await resolvePublicShopProduct(HOODIE_ID);
    expect(found?.canonicalSlug).toBe("hoodie");
    expect(found?.product.imageUrl).toBe("https://cdn.test/products/hoodie.jpg");
  });

  it("uses the id when the product has no slug", async () => {
    vi.mocked(createClient).mockResolvedValue(
      queuedClient([{ data: { ...hoodie, slug: "" }, error: null }]) as never,
    );
    const found = await resolvePublicShopProduct(HOODIE_ID);
    expect(found?.canonicalSlug).toBe(HOODIE_ID);
  });

  it("returns null when the id is missing", async () => {
    vi.mocked(createClient).mockResolvedValue(queuedClient([{ data: null, error: null }]) as never);
    await expect(resolvePublicShopProduct(HOODIE_ID)).resolves.toBeNull();
  });

  it("returns null when the slug query fails", async () => {
    vi.mocked(createClient).mockResolvedValue(
      queuedClient([{ data: null, error: { message: "down" } }]) as never,
    );
    await expect(resolvePublicShopProduct("hoodie")).resolves.toBeNull();
  });

  it("returns the product for its current slug", async () => {
    vi.mocked(createClient).mockResolvedValue(queuedClient([{ data: hoodie, error: null }]) as never);
    const found = await resolvePublicShopProduct("hoodie");
    expect(found?.canonicalSlug).toBe("hoodie");
  });

  it("returns null when the slug row is inactive", async () => {
    vi.mocked(createClient).mockResolvedValue(
      queuedClient([{ data: { ...hoodie, active: false }, error: null }]) as never,
    );
    await expect(resolvePublicShopProduct("hoodie")).resolves.toBeNull();
  });

  it("returns null when the alias query fails", async () => {
    vi.mocked(createClient).mockResolvedValue(
      queuedClient([
        { data: null, error: null },
        { data: null, error: { message: "alias down" } },
      ]) as never,
    );
    await expect(resolvePublicShopProduct("old-hoodie")).resolves.toBeNull();
  });

  it("returns null when the alias is missing", async () => {
    vi.mocked(createClient).mockResolvedValue(
      queuedClient([
        { data: null, error: null },
        { data: null, error: null },
      ]) as never,
    );
    await expect(resolvePublicShopProduct("old-hoodie")).resolves.toBeNull();
  });

  it("follows an alias to the product", async () => {
    vi.mocked(createClient).mockResolvedValue(
      queuedClient([
        { data: null, error: null },
        { data: { product_id: HOODIE_ID }, error: null },
        { data: hoodie, error: null },
      ]) as never,
    );
    const found = await resolvePublicShopProduct("old-hoodie");
    expect(found?.product.id).toBe(HOODIE_ID);
    expect(found?.canonicalSlug).toBe("hoodie");
  });

  it("uses the product id when the alias target has no slug", async () => {
    vi.mocked(createClient).mockResolvedValue(
      queuedClient([
        { data: null, error: null },
        { data: { product_id: HOODIE_ID }, error: null },
        { data: { ...hoodie, slug: null }, error: null },
      ]) as never,
    );
    const found = await resolvePublicShopProduct("old-hoodie");
    expect(found?.canonicalSlug).toBe(HOODIE_ID);
  });

  it("returns null when the alias target is gone", async () => {
    vi.mocked(createClient).mockResolvedValue(
      queuedClient([
        { data: null, error: null },
        { data: { product_id: HOODIE_ID }, error: null },
        { data: null, error: null },
      ]) as never,
    );
    await expect(resolvePublicShopProduct("old-hoodie")).resolves.toBeNull();
  });
});
