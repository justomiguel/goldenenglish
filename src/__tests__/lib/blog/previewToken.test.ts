import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createBlogPreviewToken, verifyBlogPreviewToken } from "@/lib/blog/previewToken";

describe("previewToken", () => {
  const prevSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "preview-test-secret";
  });

  afterEach(() => {
    if (prevSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = prevSecret;
    vi.useRealTimers();
  });

  it("creates and verifies a token scoped to the active tenant", () => {
    const token = createBlogPreviewToken("art-1", 60, "nago");
    expect(token).toBeTruthy();
    expect(verifyBlogPreviewToken(token!, "nago")?.articleId).toBe("art-1");
    expect(verifyBlogPreviewToken(token!, "golden")).toBeNull();
  });

  it("rejects an expired token", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const token = createBlogPreviewToken("art-1", 10, "nago");
    vi.setSystemTime(new Date("2026-01-01T00:00:20Z"));
    expect(verifyBlogPreviewToken(token!, "nago")).toBeNull();
  });
});
