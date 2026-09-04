/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { buildGuestShopperProfile } from "@/lib/shop/guestShopperProfile";

describe("buildGuestShopperProfile", () => {
  it("uses local-part and shop:{uuid} dni", () => {
    const p = buildGuestShopperProfile(
      "Ada.Lovelace@school.cl",
      "11111111-1111-1111-1111-111111111111",
    );
    expect(p.first_name).toBe("Ada.Lovelace");
    expect(p.last_name).toBe("Tienda");
    expect(p.dni_or_passport).toBe("shop:11111111-1111-1111-1111-111111111111");
    expect(p.role).toBe("parent");
  });
  it("falls back to Invitado when local-part empty", () => {
    expect(
      buildGuestShopperProfile("@x.com", "22222222-2222-2222-2222-222222222222").first_name,
    ).toBe("Invitado");
  });
});
