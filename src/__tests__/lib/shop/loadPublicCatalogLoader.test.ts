/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { loadPublicCatalog, loadPublicProduct } from "@/lib/shop/loadPublicCatalog";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/shop/shopMedia", () => ({
  shopProductImagePublicUrl: (path: string | null | undefined) =>
    path ? `https://cdn.test/${path}` : null,
}));

function catalogClient(data: unknown, error: unknown = null) {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data, error }),
    })),
  };
}

function productClient(data: unknown, error: unknown = null) {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    })),
  };
}

const hoodieRow = {
  id: "hoodie",
  title: "Hoodie",
  description: "Warm",
  image_path: "products/hoodie.jpg",
  active: true,
  shop_product_variants: [
    { id: "buyable", active: true, stock: 2, price: 20, size: "M", color: "Navy" },
  ],
};

describe("loadPublicCatalog", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset();
  });

  it("returns mapped catalog cards with public image URLs", async () => {
    vi.mocked(createClient).mockResolvedValue(catalogClient([hoodieRow]) as never);
    await expect(loadPublicCatalog()).resolves.toEqual([
      {
        id: "hoodie",
        slug: "",
        title: "Hoodie",
        imageUrl: "https://cdn.test/products/hoodie.jpg",
        soldOut: false,
      },
    ]);
  });

  it("returns an empty list when the query fails", async () => {
    vi.mocked(createClient).mockResolvedValue(
      catalogClient(null, { message: "down" }) as never,
    );
    await expect(loadPublicCatalog()).resolves.toEqual([]);
  });
});

describe("loadPublicProduct", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset();
  });

  it("returns null when the product is missing", async () => {
    vi.mocked(createClient).mockResolvedValue(productClient(null) as never);
    await expect(loadPublicProduct("missing")).resolves.toBeNull();
  });

  it("returns null when the product query fails", async () => {
    vi.mocked(createClient).mockResolvedValue(
      productClient(null, { message: "down" }) as never,
    );
    await expect(loadPublicProduct("hoodie")).resolves.toBeNull();
  });

  it("resolves the product image URL", async () => {
    vi.mocked(createClient).mockResolvedValue(productClient(hoodieRow) as never);
    const product = await loadPublicProduct("hoodie");
    expect(product?.imageUrl).toBe("https://cdn.test/products/hoodie.jpg");
    expect(product?.variants).toHaveLength(1);
  });
});
