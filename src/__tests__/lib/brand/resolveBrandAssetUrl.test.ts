import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { resolveBrandAssetUrl } from "@/lib/brand/resolveBrandAssetUrl";

describe("resolveBrandAssetUrl", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps absolute URLs unchanged", () => {
    expect(resolveBrandAssetUrl("https://cdn.example/x.png", "/fallback")).toBe(
      "https://cdn.example/x.png",
    );
  });

  it("keeps site-relative /public paths unchanged", () => {
    expect(resolveBrandAssetUrl("/images/logo.png", "/fallback")).toBe(
      "/images/logo.png",
    );
  });

  it("builds Storage public URL for object keys (no leading slash)", () => {
    expect(
      resolveBrandAssetUrl(
        "tid/migration/images/logo.png",
        "/images/logo.png",
      ),
    ).toBe(
      "https://abc.supabase.co/storage/v1/object/public/landing-media/tid/migration/images/logo.png",
    );
  });

  it("falls back when Supabase URL is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_URL", "");
    expect(resolveBrandAssetUrl("tid/x.png", "/fallback.png")).toBe("/fallback.png");
  });
});
