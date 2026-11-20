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

import { POST } from "@/app/api/faq/metrics/route";

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/faq/metrics", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/faq/metrics", () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({ error: null });
  });

  it("rejects an unknown question id and does not call the RPC", async () => {
    const response = await post({ kind: "open", questionId: "orbit" });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, code: "invalid" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("records a visit with a null question id and keeps the response private", async () => {
    const response = await post({ kind: "visit", questionId: null });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("private");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(rpc).toHaveBeenCalledWith(
      "record_faq_metric",
      expect.objectContaining({ p_kind: "visit", p_question_id: null }),
    );
  });
});
