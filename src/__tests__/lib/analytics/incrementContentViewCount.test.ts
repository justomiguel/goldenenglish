import { describe, expect, it, vi } from "vitest";
import { incrementContentViewCount } from "@/lib/analytics/server/incrementContentViewCount";

function buildSupabaseMock(options: {
  dedupeRows?: { id: string }[];
  dedupeError?: { message: string } | null;
  insertError?: { message: string } | null;
  incrementOk?: boolean;
}) {
  const incrementStoredCount = vi.fn(async () => options.incrementOk ?? true);

  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.gte = vi.fn(() => chain);
  chain.contains = vi.fn(() => chain);
  chain.limit = vi.fn(async () => ({
    data: options.dedupeRows ?? [],
    error: options.dedupeError ?? null,
  }));

  const from = vi.fn((table: string) => {
    if (table === "user_events") {
      return {
        select: chain.select,
        eq: chain.eq,
        gte: chain.gte,
        contains: chain.contains,
        limit: chain.limit,
        insert: vi.fn(async () => ({ error: options.insertError ?? null })),
      };
    }
    return chain;
  });

  return {
    supabase: { from },
    incrementStoredCount,
  };
}

describe("incrementContentViewCount", () => {
  it("dedupes when a recent matching user_event exists", async () => {
    const { supabase, incrementStoredCount } = buildSupabaseMock({
      dedupeRows: [{ id: "evt-1" }],
    });

    const result = await incrementContentViewCount(supabase as never, {
      resourceId: "article-1",
      entity: "section:blog",
      kind: "article_view",
      userId: "user-1",
      sessionKey: "es:slug",
      logScope: "test.increment_view",
      incrementStoredCount,
    });

    expect(result).toEqual({ ok: true, deduped: true });
    expect(incrementStoredCount).not.toHaveBeenCalled();
  });

  it("records telemetry and increments stored count on a fresh view", async () => {
    const { supabase, incrementStoredCount } = buildSupabaseMock({
      dedupeRows: [],
      incrementOk: true,
    });

    const result = await incrementContentViewCount(supabase as never, {
      resourceId: "event-1",
      entity: "section:events",
      kind: "event_view",
      sessionKey: "es:workshop",
      logScope: "test.increment_view",
      incrementStoredCount,
    });

    expect(result).toEqual({ ok: true, deduped: false });
    expect(incrementStoredCount).toHaveBeenCalledOnce();
    expect(supabase.from).toHaveBeenCalledWith("user_events");
  });
});
