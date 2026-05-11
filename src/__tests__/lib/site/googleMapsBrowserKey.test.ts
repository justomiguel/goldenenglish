import { afterEach, describe, expect, it, vi } from "vitest";
import { readGoogleMapsBrowserKey } from "@/lib/site/googleMapsBrowserKey";

describe("readGoogleMapsBrowserKey", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns trimmed key when set", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "  abc  ");
    expect(readGoogleMapsBrowserKey()).toBe("abc");
  });

  it("returns empty when unset", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "");
    expect(readGoogleMapsBrowserKey()).toBe("");
  });
});
