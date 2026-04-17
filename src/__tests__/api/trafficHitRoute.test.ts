/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/analytics/traffic-hit/route";

const insertTrafficPageHit = vi.fn().mockResolvedValue({ ok: true });

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  })),
}));

vi.mock("@/lib/analytics/recordTrafficPageHitServer", () => ({
  insertTrafficPageHit: (...args: unknown[]) => insertTrafficPageHit(...args),
  clientIpFromHeaders: vi.fn(() => null),
}));

describe("POST /api/analytics/traffic-hit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 on invalid path", async () => {
    const req = new Request("http://localhost/api/analytics/traffic-hit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pathname: "no-leading-slash" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(insertTrafficPageHit).not.toHaveBeenCalled();
  });

  it("persists hit with geo headers via insertTrafficPageHit", async () => {
    const req = new Request("http://localhost/api/analytics/traffic-hit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "x-vercel-ip-country": "AR",
        "x-vercel-ip-country-region": "X",
      },
      body: JSON.stringify({ pathname: "/es/register" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(insertTrafficPageHit).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/es/register",
        userId: null,
        geoCountry: "AR",
        geoRegion: "X",
      }),
    );
  });
});
