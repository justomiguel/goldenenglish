/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";

const insertMock = vi.fn();
const authGetUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: authGetUser },
    from: vi.fn(() => ({
      insert: insertMock,
    })),
  })),
}));

describe("recordUserEventServer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertMock.mockResolvedValue({ error: null });
  });

  it("returns ok:false when there is no session user", async () => {
    authGetUser.mockResolvedValue({ data: { user: null } });
    const r = await recordUserEventServer({
      userId: "u1",
      eventType: "click",
      entity: "section:test",
    });
    expect(r).toEqual({ ok: false });
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("returns ok:false when session user id does not match input", async () => {
    authGetUser.mockResolvedValue({ data: { user: { id: "other" } } });
    const r = await recordUserEventServer({
      userId: "u1",
      eventType: "action",
      entity: "section:test",
    });
    expect(r).toEqual({ ok: false });
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("inserts sanitized metadata and returns ok:true", async () => {
    authGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    const r = await recordUserEventServer({
      userId: "u1",
      eventType: "page_view",
      entity: "route:/en/x",
      metadata: { path: "/en/x" },
    });
    expect(r).toEqual({ ok: true });
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "u1",
        event_type: "page_view",
        entity: "route:/en/x",
        metadata: expect.any(Object),
      }),
    );
  });

  it("returns ok:false when insert fails", async () => {
    authGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    insertMock.mockResolvedValue({ error: { message: "rls" } });
    const r = await recordUserEventServer({
      userId: "u1",
      eventType: "session_start",
      entity: "session:start",
    });
    expect(r).toEqual({ ok: false });
  });
});
