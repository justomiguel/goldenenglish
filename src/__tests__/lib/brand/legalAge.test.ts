import { describe, it, expect } from "vitest";
import { getLegalAgeMajorityFromSystem } from "@/lib/brand/legalAge";

describe("getLegalAgeMajorityFromSystem", () => {
  it("returns 18 from system.properties by default", () => {
    expect(getLegalAgeMajorityFromSystem()).toBe(18);
  });
});
