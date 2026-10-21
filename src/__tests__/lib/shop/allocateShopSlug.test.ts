import { describe, expect, it } from "vitest";
import { allocateShopSlug } from "@/lib/shop/allocateShopSlug";

describe("allocateShopSlug", () => {
  it("slugifies the title and adds a suffix when the slug is taken", () => {
    const taken = new Set(["remera"]);
    expect(allocateShopSlug("Remera", taken, null)).toEqual({ slug: "remera-2", retire: null });
  });

  it("keeps the current slug when the base is still taken", () => {
    const taken = new Set(["remera"]);
    expect(allocateShopSlug("Remera", taken, "remera-2")).toEqual({
      slug: "remera-2",
      retire: null,
    });
  });

  it("retires the previous slug when the title changes to a free slug", () => {
    expect(allocateShopSlug("Polo", new Set(), "remera")).toEqual({
      slug: "polo",
      retire: "remera",
    });
  });

  it("falls back to producto", () => {
    expect(allocateShopSlug("!!!", new Set(), null)).toEqual({ slug: "producto", retire: null });
  });
});
