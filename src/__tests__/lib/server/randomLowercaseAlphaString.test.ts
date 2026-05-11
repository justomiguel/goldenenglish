import { describe, it, expect } from "vitest";
import { randomLowercaseAlphaString } from "@/lib/server/randomLowercaseAlphaString";

describe("randomLowercaseAlphaString", () => {
  it("returns only a–z and requested length (clamped)", () => {
    const s = randomLowercaseAlphaString(8);
    expect(s).toHaveLength(8);
    expect(/^[a-z]+$/.test(s)).toBe(true);
  });
});
