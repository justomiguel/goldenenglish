/** @vitest-environment node */
import { describe, expect, it, vi, beforeEach } from "vitest";

const runAdminWeeklyDigest = vi.fn();
vi.mock("@/lib/admin-digest/runAdminWeeklyDigest", () => ({
  runAdminWeeklyDigest: (...args: unknown[]) => runAdminWeeklyDigest(...args),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(async () => ({})),
}));
vi.mock("@/lib/admin-digest/rasterizeDigestCharts", () => ({
  rasterizeDigestSvg: vi.fn(),
}));

import { GET } from "@/app/api/cron/admin-weekly-digest/route";

describe("GET /api/cron/admin-weekly-digest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runAdminWeeklyDigest.mockResolvedValue({ ok: true, sent: 0 });
  });

  it("returns 401 without a bearer secret", async () => {
    const res = await GET(new Request("http://localhost/api/cron/admin-weekly-digest"));
    expect(res.status).toBe(401);
    expect(runAdminWeeklyDigest).not.toHaveBeenCalled();
  });

  it("rejects a secret that is only in the query string", async () => {
    vi.stubEnv("CRON_SECRET", "abc");
    const res = await GET(new Request("http://localhost/api/cron/admin-weekly-digest?secret=abc"));
    expect(res.status).toBe(401);
    expect(runAdminWeeklyDigest).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
