import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ rpc }),
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerException: vi.fn(),
  logSupabaseClientError: vi.fn(),
}));

import { POST } from "@/app/api/blog/metrics/route";

describe("POST /api/blog/metrics", () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({ error: null });
  });

  it("rejects an invalid body", async () => {
    const response = await POST(
      new Request("http://localhost/api/blog/metrics", {
        method: "POST",
        body: JSON.stringify({ kind: "nope" }),
      }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, code: "invalid" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("records a list view and keeps the response private", async () => {
    const response = await POST(
      new Request("http://localhost/api/blog/metrics", {
        method: "POST",
        body: JSON.stringify({
          kind: "list_view",
          articleId: null,
          source: null,
          locale: "es",
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("private");
    expect(await response.json()).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith(
      "record_blog_metric",
      expect.objectContaining({ p_kind: "list_view", p_article_id: null, p_source: null }),
    );
  });
});
