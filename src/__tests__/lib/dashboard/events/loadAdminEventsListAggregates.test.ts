/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadAdminEventsListAggregates } from "@/lib/dashboard/events/loadAdminEventsListAggregates";

vi.mock("@/lib/logging/serverActionLog", () => ({ logSupabaseClientError: vi.fn() }));

function clientReturning(result: { data: unknown; error: unknown }) {
  return { rpc: vi.fn().mockResolvedValue(result) } as unknown as SupabaseClient;
}

describe("loadAdminEventsListAggregates", () => {
  it("keeps registrations and seats apart", async () => {
    // Ten seats sold across seven purchases: three of them were multi-ticket.
    const client = clientReturning({
      data: [
        {
          total_events: 4,
          total_published: 3,
          total_upcoming: 2,
          total_attendees: 10,
          total_waitlist: 1,
          total_registrations: 7,
          total_seats: 10,
        },
      ],
      error: null,
    });

    const result = await loadAdminEventsListAggregates(client, "");

    expect(result.totalRegistrations).toBe(7);
    expect(result.totalSeats).toBe(10);
  });

  it("reads zeros rather than NaN from an old function that has no seat columns", async () => {
    const client = clientReturning({
      data: [{ total_events: 1, total_published: 1, total_upcoming: 0, total_attendees: 2, total_waitlist: 0 }],
      error: null,
    });

    const result = await loadAdminEventsListAggregates(client, "");

    expect(result.totalRegistrations).toBe(0);
    expect(result.totalSeats).toBe(0);
    expect(result.totalAttendees).toBe(2);
  });

  it("falls back to zeros when the RPC fails", async () => {
    const client = clientReturning({ data: null, error: { message: "boom" } });

    await expect(loadAdminEventsListAggregates(client, "")).resolves.toMatchObject({
      totalEvents: 0,
      totalRegistrations: 0,
      totalSeats: 0,
    });
  });
});
