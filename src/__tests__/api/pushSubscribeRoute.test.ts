import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const upsert = vi.fn();
const getUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
    from: () => ({ upsert }),
  })),
}));

import { POST } from "@/app/api/push/subscribe/route";

describe("POST /api/push/subscribe", () => {
  beforeEach(() => {
    upsert.mockReset();
    getUser.mockReset();
  });

  it("returns 401 without session", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const res = await POST(
      new NextRequest("http://localhost/api/push/subscribe", {
        method: "POST",
        body: JSON.stringify({
          endpoint: "https://push.example/sub",
          keys: { p256dh: "a", auth: "b" },
        }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("upserts subscription for authenticated user", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    upsert.mockResolvedValue({ error: null });
    const res = await POST(
      new NextRequest("http://localhost/api/push/subscribe", {
        method: "POST",
        headers: { "user-agent": "vitest" },
        body: JSON.stringify({
          endpoint: "https://push.example/sub",
          keys: { p256dh: "a", auth: "b" },
        }),
      }),
    );
    expect(res.status).toBe(200);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-1", endpoint: "https://push.example/sub" }),
      { onConflict: "user_id,endpoint" },
    );
    expect(res.headers.get("Cache-Control")).toContain("private");
  });
});
