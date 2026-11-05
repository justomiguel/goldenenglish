/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import { holdEventSeats, loadEventSeatHoldRows } from "@/lib/events/server/eventSeatHoldsServer";

vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
  logServerWarn: vi.fn(),
}));

describe("eventSeatHoldsServer", () => {
  it("returns taken seats from the hold rpc", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: { held: ["a"], taken: ["b"], expires_at: "2026-11-05T22:00:00.000Z", code: "ok" },
      error: null,
    });
    const result = await holdEventSeats({ rpc } as never, {
      eventId: "ev-1",
      tokenHash: "hash",
      seatKeys: ["a", "b"],
      maxSeats: 2,
    });
    expect(result).toEqual({
      ok: true,
      held: ["a"],
      taken: ["b"],
      expiresAt: "2026-11-05T22:00:00.000Z",
    });
  });

  it("splits holds of this token from holds of other buyers", async () => {
    const admin = {
      from: () => ({
        select: () => ({
          eq: () => ({
            gt: async () => ({
              data: [
                { seat_key: "mine", hold_token_hash: "hash", expires_at: "2026-11-05T22:00:00.000Z" },
                { seat_key: "theirs", hold_token_hash: "other", expires_at: "2026-11-05T22:00:00.000Z" },
              ],
              error: null,
            }),
          }),
        }),
      }),
    };
    const rows = await loadEventSeatHoldRows(admin as never, "ev-1", "hash");
    expect(rows.myHolds).toEqual(["mine"]);
    expect(rows.heldByOthers).toEqual(["theirs"]);
  });
});
