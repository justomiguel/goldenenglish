/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { publishScheduledArticles } = vi.hoisted(() => ({
  publishScheduledArticles: vi.fn(),
}));
vi.mock("@/lib/blog/server", () => ({
  publishScheduledArticles,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: vi.fn() }),
}));

import { GET } from "@/app/api/cron/publish-scheduled-articles/route";

describe("GET /api/cron/publish-scheduled-articles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    publishScheduledArticles.mockResolvedValue({ ok: true, publishedCount: 2 });
  });

  it("returns 401 without header auth", async () => {
    const res = await GET(new Request("http://localhost/api/cron/publish-scheduled-articles"));
    expect(res.status).toBe(401);
    expect(publishScheduledArticles).not.toHaveBeenCalled();
  });

  it("executes publish when bearer token matches", async () => {
    vi.stubEnv("CRON_SECRET", "abc");
    const res = await GET(
      new Request("http://localhost/api/cron/publish-scheduled-articles", {
        headers: { authorization: "Bearer abc" },
      }),
    );
    expect(res.status).toBe(200);
    expect(publishScheduledArticles).toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("rejects query-string secret", async () => {
    vi.stubEnv("CRON_SECRET", "abc");
    const res = await GET(
      new Request("http://localhost/api/cron/publish-scheduled-articles?secret=abc"),
    );
    expect(res.status).toBe(401);
    expect(publishScheduledArticles).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
