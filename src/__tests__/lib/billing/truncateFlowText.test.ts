import { describe, expect, it } from "vitest";
import { truncateForFlowText } from "@/lib/billing/truncateFlowText";

describe("truncateForFlowText", () => {
  it("returns inner trim unchanged when short", () => {
    expect(truncateForFlowText("  hi  ", 10)).toBe("hi");
  });

  it("truncates long strings with ellipsis", () => {
    expect(truncateForFlowText("abcdef", 4)).toBe("abc…");
  });
});
