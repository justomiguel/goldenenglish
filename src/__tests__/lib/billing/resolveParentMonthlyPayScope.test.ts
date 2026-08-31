/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { resolveParentMonthlyPayScope } from "@/lib/billing/resolveParentMonthlyPayScope";

describe("resolveParentMonthlyPayScope", () => {
  it("honors the requested scope when partial payments are allowed", () => {
    expect(
      resolveParentMonthlyPayScope({
        requested: "current",
        allowPartial: true,
        payableSectionCount: 3,
      }),
    ).toBe("current");
  });

  it("forces all when the institute forbids partial section payments", () => {
    expect(
      resolveParentMonthlyPayScope({
        requested: "current",
        allowPartial: false,
        payableSectionCount: 2,
      }),
    ).toBe("all");
  });

  it("keeps current when only one section is payable even if partials are off", () => {
    expect(
      resolveParentMonthlyPayScope({
        requested: "current",
        allowPartial: false,
        payableSectionCount: 1,
      }),
    ).toBe("current");
  });
});
