/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadShopCheckoutPreview } from "@/lib/shop/loadShopCheckoutPreview";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));
vi.mock("@/lib/billing/loadBillingCurrencySetting", () => ({
  loadBillingCurrencySetting: vi.fn(async () => ({ currency: "CLP" })),
}));
vi.mock("@/lib/payment-gateways/loadEnabledGatewaysForBillingCurrency", () => ({
  loadEnabledGatewaysForBillingCurrency: vi.fn(async () => [{ provider: "flow" }]),
}));

describe("loadShopCheckoutPreview", () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset();
    vi.mocked(createAdminClient).mockReset();
  });

  it("returns a guest session and a mapped line", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: null } }) },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                id: "v1",
                price: 10,
                size: "M",
                color: "Navy",
                shop_products: { title: "Hoodie", active: true },
              },
              error: null,
            }),
          }),
        }),
      }),
    } as never);

    const preview = await loadShopCheckoutPreview("es", "v1");
    expect(preview.session.requireEmail).toBe(true);
    expect(preview.gateways).toEqual(["flow"]);
    expect(preview.line?.title).toBe("Hoodie");
    expect(preview.line?.quantity).toBe(1);
  });

  it("marks a logged-in student so checkout can block pay", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: "s1" } } }) },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    } as never);
    vi.mocked(createAdminClient).mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { role: "student" }, error: null }),
          }),
        }),
      }),
    } as never);

    const preview = await loadShopCheckoutPreview("en", "");
    expect(preview.session).toEqual({ role: "student", requireEmail: false });
    expect(preview.line).toBeNull();
  });
});
