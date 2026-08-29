/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { resolveRegisterIntent } from "@/lib/settings/resolveRegisterIntent";

describe("resolveRegisterIntent", () => {
  it("redirects trial requests to reserve when the site is reserve-only", () => {
    expect(
      resolveRegisterIntent({ siteMode: "reserve", requested: "trial" }),
    ).toEqual({ kind: "redirect", to: "reserve" });
  });

  it("redirects bare register to trial when the site is trial-only", () => {
    expect(
      resolveRegisterIntent({ siteMode: "trial", requested: null }),
    ).toEqual({ kind: "redirect", to: "trial" });
    expect(
      resolveRegisterIntent({ siteMode: "trial", requested: "reserve" }),
    ).toEqual({ kind: "redirect", to: "trial" });
  });

  it("treats bare register as reserve when the site offers both", () => {
    expect(
      resolveRegisterIntent({ siteMode: "both", requested: null }),
    ).toEqual({ kind: "ok", intent: "reserve" });
    expect(
      resolveRegisterIntent({ siteMode: "both", requested: "trial" }),
    ).toEqual({ kind: "ok", intent: "trial" });
  });

  it("redirects an invalid intent query to reserve", () => {
    expect(
      resolveRegisterIntent({ siteMode: "both", requested: "workshop" }),
    ).toEqual({ kind: "redirect", to: "reserve" });
  });
});
