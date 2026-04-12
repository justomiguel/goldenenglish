import { describe, it, expect, vi, afterEach } from "vitest";
import { browserOriginAbsolutePath } from "@/lib/analytics/browserOriginAbsolutePath";

describe("browserOriginAbsolutePath", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses origin + path when window exists (jsdom)", () => {
    const u = browserOriginAbsolutePath("/api/x");
    expect(u.endsWith("/api/x")).toBe(true);
    expect(u).toMatch(/^https?:\/\//);
  });

  it("prefixes origin in the browser", () => {
    vi.stubGlobal("window", {
      location: { origin: "https://example.com" },
    });
    expect(browserOriginAbsolutePath("/api/analytics/events")).toBe(
      "https://example.com/api/analytics/events",
    );
  });
});
