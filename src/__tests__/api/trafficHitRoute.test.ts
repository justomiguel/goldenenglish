/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/analytics/traffic-hit/route";

const insertMock = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: insertMock,
    })),
  })),
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
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("inserts guest hit with geo headers", async () => {
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
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        visitor_kind: "guest",
        pathname: "/es/register",
        geo_country: "AR",
        geo_region: "X",
      }),
    );
  });
});
