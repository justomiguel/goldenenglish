import { describe, expect, it } from "vitest";
import {
  isMarketingFullBleedLandingKind,
  marketingLandingSuppressesShellFooter,
  MARKETING_FULL_BLEED_LANDING_KINDS,
} from "@/lib/theme/marketingLandingKinds";

describe("marketingLandingKinds", () => {
  it("lists mozarthitos and espaciozenit", () => {
    expect(MARKETING_FULL_BLEED_LANDING_KINDS).toContain("mozarthitos");
    expect(MARKETING_FULL_BLEED_LANDING_KINDS).toContain("espaciozenit");
  });

  it("isMarketingFullBleedLandingKind matches marketing shells only", () => {
    expect(isMarketingFullBleedLandingKind("mozarthitos")).toBe(true);
    expect(isMarketingFullBleedLandingKind("espaciozenit")).toBe(true);
    expect(isMarketingFullBleedLandingKind("classic")).toBe(false);
    expect(isMarketingFullBleedLandingKind("minimal")).toBe(false);
  });

  it("marketingLandingSuppressesShellFooter only for embedded-footer templates", () => {
    expect(marketingLandingSuppressesShellFooter("espaciozenit")).toBe(true);
    expect(marketingLandingSuppressesShellFooter("mozarthitos")).toBe(false);
    expect(marketingLandingSuppressesShellFooter("classic")).toBe(false);
  });
});
