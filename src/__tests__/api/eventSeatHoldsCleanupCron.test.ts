/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { verifyCronRequest, deleteExpiredEventSeatHolds } = vi.hoisted(() => ({
  verifyCronRequest: vi.fn(() => true),
  deleteExpiredEventSeatHolds: vi.fn(async () => 2),
}));

vi.mock("@/lib/auth/verifyCronRequest", () => ({
  verifyCronRequest: () => verifyCronRequest(),
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: async () => ({}) }));
vi.mock("@/lib/events/server/eventSeatHoldsServer", () => ({ deleteExpiredEventSeatHolds }));
vi.mock("@/lib/logging/serverActionLog", () => ({ logServerException: vi.fn() }));

import { GET } from "@/app/api/cron/event-seat-holds-cleanup/route";

describe("event seat hold cleanup cron", () => {
  beforeEach(() => {
    verifyCronRequest.mockReturnValue(true);
    deleteExpiredEventSeatHolds.mockClear();
  });

  it("rejects a secret in the query string", async () => {
    verifyCronRequest.mockReturnValue(false);
    const response = await GET(new Request("http://localhost/api/cron/event-seat-holds-cleanup?secret=leak"));
    expect(response.status).toBe(401);
    expect(deleteExpiredEventSeatHolds).not.toHaveBeenCalled();
  });

  it("deletes expired holds", async () => {
    const response = await GET(new Request("http://localhost/api/cron/event-seat-holds-cleanup"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, removed: 2 });
  });
});
