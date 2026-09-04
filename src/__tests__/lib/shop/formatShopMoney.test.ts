/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { formatShopMoney } from "@/lib/shop/formatShopMoney";

describe("formatShopMoney", () => {
  it("formats an amount in the given currency and locale", () => {
    expect(formatShopMoney(20, "USD", "en")).toContain("20");
  });
});
