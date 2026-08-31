/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { nagoLandingRegisterCtas } from "@/lib/landing/nagoLandingRegisterCtas";
import { dictEn } from "@/test/dictEn";

describe("nagoLandingRegisterCtas", () => {
  it("defaults to reserve and trial on Nagô", () => {
    const items = nagoLandingRegisterCtas({ locale: "es", dict: dictEn });
    expect(items.map((i) => i.intent)).toEqual(["reserve", "trial"]);
    expect(items[0]?.href).toBe("/es/register");
    expect(items[1]?.href).toBe("/es/register?intent=trial");
    expect(items[0]?.label).toBe(dictEn.landing.nago.hero.ctaReserve);
    expect(items[1]?.label).toBe(dictEn.landing.nago.hero.ctaTrial);
  });
});
