import { describe, expect, it } from "vitest";
import { parseNagoTenantExtras } from "@/lib/register/packs/nago/parseNagoTenantExtras";
import { validNagoExtras } from "@/__tests__/lib/register/packs/nagoExtrasFixture";

describe("parseNagoTenantExtras", () => {
  it("returns null for empty or foreign payloads", () => {
    expect(parseNagoTenantExtras(null)).toBeNull();
    expect(parseNagoTenantExtras({})).toBeNull();
    expect(parseNagoTenantExtras({ pack: "classic" })).toBeNull();
    expect(parseNagoTenantExtras({ pack: "nago" })).toBeNull();
  });

  it("returns the Nagô shape for a valid object", () => {
    const extras = validNagoExtras();
    expect(parseNagoTenantExtras(extras)).toEqual(extras);
  });
});
