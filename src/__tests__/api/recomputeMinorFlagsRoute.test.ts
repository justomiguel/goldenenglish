/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";

const rpc = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc }),
}));

import { GET } from "@/app/api/cron/recompute-minor-flags/route";

describe("GET /api/cron/recompute-minor-flags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rpc.mockResolvedValue({ error: null });
  });

  it("returns 401 without CRON_SECRET match", async () => {
    const res = await GET(new Request("http://localhost/api/cron/recompute-minor-flags"));
    expect(res.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("runs rpc when bearer matches CRON_SECRET", async () => {
    vi.stubEnv("CRON_SECRET", "abc");
    const res = await GET(
      new Request("http://localhost/api/cron/recompute-minor-flags", {
        headers: { authorization: "Bearer abc" },
      }),
    );
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("profiles_recompute_minor_flags");
    vi.unstubAllEnvs();
  });

  /**
   * REGRESSION CHECK: query-string secret used to be accepted as a fallback,
   * which leaked the cron secret via Referer / proxy logs / browser history
   * (OWASP A05/A07). It must NEVER trigger work, even if header is missing.
   */
  it("rejects ?secret=... in the query string", async () => {
    vi.stubEnv("CRON_SECRET", "abc");
    const res = await GET(
      new Request("http://localhost/api/cron/recompute-minor-flags?secret=abc"),
    );
    expect(res.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
