/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/analytics/events/route";

const insertMock = vi.fn().mockResolvedValue({ error: null });
const getUserMock = vi.fn().mockResolvedValue({
  data: { user: { id: "11111111-1111-1111-1111-111111111111" } },
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: () => getUserMock() },
    from: () => ({ insert: (rows: unknown) => insertMock(rows) }),
  })),
}));

describe("POST /api/analytics/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertMock.mockResolvedValue({ error: null });
    getUserMock.mockResolvedValue({
      data: { user: { id: "11111111-1111-1111-1111-111111111111" } },
    });
  });

  it("returns 400 for empty body", async () => {
    const req = new Request("http://localhost/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("returns 400 for truncated / invalid JSON", async () => {
    const req = new Request("http://localhost/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("returns 401 when there is no session user", async () => {
    getUserMock.mockResolvedValueOnce({ data: { user: null } });
    const req = new Request("http://localhost/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        events: [
          {
            event_type: "page_view",
            entity: "route:test",
            metadata: { path: "/es" },
          },
        ],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("inserts sanitized rows and returns 200", async () => {
    const req = new Request("http://localhost/api/analytics/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-vercel-ip-country": "AR",
        "x-forwarded-for": "203.0.113.1",
      },
      body: JSON.stringify({
        events: [
          {
            event_type: "click",
            entity: "route:billing",
            metadata: { k: "v" },
          },
        ],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(insertMock).toHaveBeenCalledWith([
      expect.objectContaining({
        user_id: "11111111-1111-1111-1111-111111111111",
        event_type: "click",
        entity: "route:billing",
        metadata: expect.objectContaining({
          k: "v",
          geo_country: "AR",
        }),
        client_ip: expect.any(String),
      }),
    ]);
  });

  it("returns 500 when Supabase insert throws (e.g. response parse)", async () => {
    insertMock.mockRejectedValueOnce(new SyntaxError("Unexpected end of JSON input"));
    const req = new Request("http://localhost/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        events: [{ event_type: "action", entity: "x" }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
