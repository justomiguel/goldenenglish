/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { mapPublicCatalog, mapPublicProduct } from "@/lib/shop/mapPublicCatalog";

describe("mapPublicCatalog", () => {
  it("marks sold out when every active variant has stock 0", () => {
    const rows = mapPublicCatalog([
      {
        id: "p",
        title: "Polera",
        image_path: null,
        active: true,
        variants: [{ id: "v", active: true, stock: 0, price: 10, size: "M", color: "Rojo" }],
      },
    ]);
    expect(rows[0]?.soldOut).toBe(true);
  });

  it("omits inactive products", () => {
    expect(mapPublicCatalog([{ id: "p", title: "X", image_path: null, active: false, variants: [] }])).toEqual(
      [],
    );
  });

  it("filters inactive and zero-stock variants from the buyable set", () => {
    const rows = mapPublicCatalog([
      {
        id: "hoodie",
        title: "Hoodie",
        image_path: "products/hoodie.jpg",
        active: true,
        variants: [
          { id: "inactive", active: false, stock: 4, price: 20, size: "L", color: "Navy" },
          { id: "empty", active: true, stock: 0, price: 20, size: "S", color: "Navy" },
          { id: "buyable", active: true, stock: 2, price: 20, size: "M", color: "Navy" },
        ],
      },
    ]);
    expect(rows).toEqual([
      { id: "hoodie", title: "Hoodie", imageUrl: "products/hoodie.jpg", soldOut: false },
    ]);
  });
});

describe("mapPublicProduct", () => {
  const hoodie = {
    id: "hoodie",
    title: "Hoodie",
    description: "Warm",
    image_path: "products/hoodie.jpg",
    active: true,
    variants: [
      { id: "inactive", active: false, stock: 4, price: 20, size: "L", color: "Navy" },
      { id: "empty", active: true, stock: 0, price: 20, size: "S", color: "Navy" },
      { id: "buyable", active: true, stock: 2, price: 20, size: "M", color: "Navy" },
    ],
  };

  it("returns null for inactive products", () => {
    expect(mapPublicProduct({ ...hoodie, active: false })).toBeNull();
  });

  it("keeps active zero-stock variants and omits inactive ones", () => {
    const product = mapPublicProduct(hoodie);
    expect(product?.variants.map((v) => v.id)).toEqual(["empty", "buyable"]);
    expect(product?.soldOut).toBe(false);
  });

  it("marks the product sold out when every listed variant has stock 0", () => {
    const product = mapPublicProduct({
      ...hoodie,
      variants: [{ id: "empty", active: true, stock: 0, price: 20, size: "S", color: "Navy" }],
    });
    expect(product?.soldOut).toBe(true);
  });
});

