import { describe, it, expect, vi, afterEach } from "vitest";

describe("readGoogleMapsMapId", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID when set", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID", "my-map-id");
    const { readGoogleMapsMapId } = await import("@/lib/site/googleMapsMapId");
    expect(readGoogleMapsMapId()).toBe("my-map-id");
  });

  it("falls back to DEMO_MAP_ID when unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID", "");
    const { readGoogleMapsMapId } = await import("@/lib/site/googleMapsMapId");
    expect(readGoogleMapsMapId()).toBe("DEMO_MAP_ID");
  });
});
