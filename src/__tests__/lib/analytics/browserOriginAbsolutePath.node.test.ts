/** @vitest-environment node */
import { describe, it, expect } from "vitest";
import { browserOriginAbsolutePath } from "@/lib/analytics/browserOriginAbsolutePath";

describe("browserOriginAbsolutePath (node)", () => {
  it("returns path unchanged when window is undefined", () => {
    expect(browserOriginAbsolutePath("/api/x")).toBe("/api/x");
    expect(browserOriginAbsolutePath("api/x")).toBe("api/x");
  });
});
