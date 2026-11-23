import { beforeEach, describe, expect, it, vi } from "vitest";

const select = vi.hoisted(() => vi.fn());
const range = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/pulsar", () => ({
  isPulsarSupabaseConfigured: () => true,
  createPulsarAdminClient: () => ({
    from: () => {
      const query = {
        select: (columns: string, options?: unknown) => {
          select(columns, options);
          return query;
        },
        eq: () => query,
        is: () => query,
        order: () => query,
        range: (from: number, to: number) => {
          range(from, to);
          return Promise.resolve({
            data: [{ id: "11111111-1111-4111-8111-111111111111", model: "gpt-test", created_at: "2026-11-21T00:00:00.000Z" }],
            error: null,
            count: 1,
          });
        },
      };
      return query;
    },
  }),
}));

import { createSupabaseOpenAiConversationStore } from "@/lib/ai/providers/openai/supabaseOpenAiConversationStore";

// REGRESSION CHECK: The public list pages with range and an exact count. It omits the OpenAI conversation id.

describe("createSupabaseOpenAiConversationStore", () => {
  beforeEach(() => {
    select.mockReset();
    range.mockReset();
  });

  it("lists one page without the OpenAI conversation id", async () => {
    const store = createSupabaseOpenAiConversationStore();
    const result = await store.listActive({
      host: "centrolisto.cl",
      ownerUserId: "00000000-0000-4000-8000-000000000001",
      from: 0,
      to: 49,
    });
    expect(select).toHaveBeenCalledWith("id, model, created_at", { count: "exact" });
    expect(range).toHaveBeenCalledWith(0, 49);
    expect(result).toEqual({
      ok: true,
      total: 1,
      rows: [{ id: "11111111-1111-4111-8111-111111111111", model: "gpt-test", createdAt: "2026-11-21T00:00:00.000Z" }],
    });
    expect(JSON.stringify(result)).not.toContain("conv_");
  });
});
