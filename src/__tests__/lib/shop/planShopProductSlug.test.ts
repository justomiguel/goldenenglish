/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { planShopProductSlug, retireShopProductSlug } from "@/lib/shop/server/planShopProductSlug";

function slugClient(options: {
  products?: { data: unknown; error: unknown };
  aliases?: { data: unknown; error: unknown };
  insertError?: { code?: string; message?: string } | null;
  dropError?: { message: string } | null;
}) {
  return {
    from(table: string) {
      return {
        select() {
          return {
            limit: async () =>
              table === "shop_products"
                ? (options.products ?? { data: [], error: null })
                : (options.aliases ?? { data: [], error: null }),
          };
        },
        insert: async () => ({ error: options.insertError ?? null }),
        delete() {
          return {
            eq() {
              return { eq: async () => ({ error: options.dropError ?? null }) };
            },
          };
        },
      };
    },
  };
}

describe("planShopProductSlug", () => {
  it("returns null when a slug list fails", async () => {
    const productsDown = slugClient({ products: { data: null, error: { message: "down" } } });
    await expect(planShopProductSlug(productsDown as never, "Polo", null, null)).resolves.toBeNull();

    const aliasesDown = slugClient({ aliases: { data: null, error: { message: "down" } } });
    await expect(planShopProductSlug(aliasesDown as never, "Polo", "self", null)).resolves.toBeNull();
  });

  it("skips the current product and blank slugs", async () => {
    const client = slugClient({
      products: {
        data: [
          { id: "self", slug: "mine" },
          { id: "other", slug: "polo" },
          { id: "blank", slug: null },
        ],
        error: null,
      },
      aliases: {
        data: [
          { product_id: "self", slug: "mine-old" },
          { product_id: "other", slug: "taken-alias" },
          { product_id: "empty", slug: "" },
        ],
        error: null,
      },
    });

    await expect(planShopProductSlug(client as never, "Campera", "self", "mine")).resolves.toEqual({
      slug: "campera",
      retire: "mine",
    });
  });

  it("allocates from empty lists", async () => {
    const client = slugClient({
      products: { data: null, error: null },
      aliases: { data: null, error: null },
    });
    await expect(planShopProductSlug(client as never, "Polo", null, null)).resolves.toEqual({
      slug: "polo",
      retire: null,
    });
  });
});

describe("retireShopProductSlug", () => {
  it("drops the next slug when nothing is retired", async () => {
    const client = slugClient({});
    await expect(retireShopProductSlug(client as never, "self", null, "polo")).resolves.toBe(true);
  });

  it("ignores a duplicate retired slug", async () => {
    const client = slugClient({ insertError: { code: "23505", message: "dup" } });
    await expect(retireShopProductSlug(client as never, "self", "old", "polo")).resolves.toBe(true);
  });

  it("returns false when retiring the old slug fails", async () => {
    const client = slugClient({ insertError: { code: "42501", message: "no" } });
    await expect(retireShopProductSlug(client as never, "self", "old", "polo")).resolves.toBe(false);
  });

  it("returns false when dropping the next slug fails", async () => {
    const client = slugClient({ dropError: { message: "no" } });
    await expect(retireShopProductSlug(client as never, "self", null, "polo")).resolves.toBe(false);
  });
});
