import { describe, expect, it, vi, beforeEach } from "vitest";
import { incrementContentViewCount } from "@/lib/analytics/server/incrementContentViewCount";

const adminFrom = vi.fn();
const sessionFrom = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: adminFrom }),
}));

function buildEventsTableMock(options: {
  dedupeRows?: { id: string }[];
  dedupeError?: { message: string } | null;
  insertError?: { message: string } | null;
}) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.gte = vi.fn(() => chain);
  chain.contains = vi.fn(() => chain);
  chain.limit = vi.fn(async () => ({
    data: options.dedupeRows ?? [],
    error: options.dedupeError ?? null,
  }));
  chain.insert = vi.fn(async () => ({ error: options.insertError ?? null }));

  return chain;
}

describe("incrementContentViewCount", () => {
  beforeEach(() => {
    adminFrom.mockReset();
    sessionFrom.mockReset();
  });

  it("dedupes when a recent matching user_event exists", async () => {
    adminFrom.mockReturnValue(
      buildEventsTableMock({
        dedupeRows: [{ id: "evt-1" }],
      }),
    );
    const incrementStoredCount = vi.fn(async () => true);

    const result = await incrementContentViewCount({ from: sessionFrom } as never, {
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
    expect(adminFrom).toHaveBeenCalledWith("user_events");
  });

  it("records telemetry via admin and increments stored count on a fresh view", async () => {
    const eventsTable = buildEventsTableMock({ dedupeRows: [] });
    adminFrom.mockReturnValue(eventsTable);
    const incrementStoredCount = vi.fn(async () => true);

    const result = await incrementContentViewCount({ from: sessionFrom } as never, {
      resourceId: "event-1",
      entity: "section:events",
      kind: "event_view",
      sessionKey: "es:workshop",
      logScope: "test.increment_view",
      incrementStoredCount,
    });

    expect(result).toEqual({ ok: true, deduped: false });
    expect(eventsTable.insert).toHaveBeenCalledOnce();
    expect(incrementStoredCount).toHaveBeenCalledOnce();
    expect(sessionFrom).not.toHaveBeenCalled();
  });

  it("records anonymous event views via admin telemetry and increments the public counter", async () => {
    const eventsTable = buildEventsTableMock({ dedupeRows: [] });
    adminFrom.mockReturnValue(eventsTable);
    const incrementStoredCount = vi.fn(async () => true);

    const result = await incrementContentViewCount({ from: sessionFrom } as never, {
      resourceId: "event-1",
      entity: "section:events",
      kind: "event_view",
      userId: null,
      sessionKey: "es:workshop",
      logScope: "events.increment_view",
      incrementStoredCount,
    });

    expect(result).toEqual({ ok: true, deduped: false });
    expect(eventsTable.insert).toHaveBeenCalledWith({
      user_id: null,
      event_type: "action",
      entity: "section:events",
      metadata: { kind: "event_view", sessionKey: "es:workshop", eventId: "event-1" },
    });
    expect(incrementStoredCount).toHaveBeenCalledOnce();
  });

  it("still increments stored count for anonymous views when telemetry insert fails", async () => {
    adminFrom.mockReturnValue(
      buildEventsTableMock({
        dedupeRows: [],
        insertError: { message: "should not block counter" },
      }),
    );
    const incrementStoredCount = vi.fn(async () => true);

    const result = await incrementContentViewCount({ from: sessionFrom } as never, {
      resourceId: "article-1",
      entity: "section:blog",
      kind: "article_view",
      sessionKey: "es:slug",
      logScope: "test.increment_view",
      incrementStoredCount,
    });

    expect(result).toEqual({ ok: true, deduped: false });
    expect(incrementStoredCount).toHaveBeenCalledOnce();
  });
});
