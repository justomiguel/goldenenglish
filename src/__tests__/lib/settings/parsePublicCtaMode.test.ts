/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { parsePublicCtaMode } from "@/lib/settings/parsePublicCtaMode";

describe("parsePublicCtaMode", () => {
  it("returns reserve for missing or invalid values", () => {
    expect(parsePublicCtaMode(undefined)).toBe("reserve");
    expect(parsePublicCtaMode(null)).toBe("reserve");
    expect(parsePublicCtaMode("")).toBe("reserve");
    expect(parsePublicCtaMode("both_please")).toBe("reserve");
    expect(parsePublicCtaMode(1)).toBe("reserve");
    expect(parsePublicCtaMode({ mode: "both" })).toBe("reserve");
  });

  it("accepts the three site modes", () => {
    expect(parsePublicCtaMode("reserve")).toBe("reserve");
    expect(parsePublicCtaMode("trial")).toBe("trial");
    expect(parsePublicCtaMode("both")).toBe("both");
  });
});
