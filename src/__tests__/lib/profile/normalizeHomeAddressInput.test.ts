import { describe, expect, it } from "vitest";
import { normalizeHomeAddressInput } from "@/lib/profile/normalizeHomeAddressInput";

describe("normalizeHomeAddressInput", () => {
  it("clears both when text empty", () => {
    expect(normalizeHomeAddressInput("", "abc")).toEqual({
      ok: true,
      value: { text: null, placeId: null },
    });
  });

  it("keeps place id with non-empty text", () => {
    expect(normalizeHomeAddressInput(" Calle 1 ", "ChIJid")).toEqual({
      ok: true,
      value: { text: "Calle 1", placeId: "ChIJid" },
    });
  });

  it("rejects long text", () => {
    const r = normalizeHomeAddressInput("z".repeat(501), null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("home_address_too_long");
  });

  it("rejects long place id", () => {
    const r = normalizeHomeAddressInput("ok", "p".repeat(257));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("home_place_id_too_long");
  });
});
