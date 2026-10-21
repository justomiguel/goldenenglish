/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadPaginatedAdminEvents } from "@/lib/dashboard/events/loadPaginatedAdminEvents";

vi.mock("@/lib/logging/serverActionLog", () => ({ logSupabaseClientError: vi.fn() }));
vi.mock("@/lib/events/server/loadActiveRegistrationFlows", () => ({
  loadRegistrationFlowPricesByEvent: vi.fn().mockResolvedValue(new Map()),
}));

const EVENT_ROW = {
  id: "event-1",
  slug: "open-day",
  title: "Open day",
  status: "published",
  event_date: "2026-11-01T15:00:00.000Z",
  capacity: 20,
  price: 10000,
  currency: "CLP",
  view_count: 3,
  price_by_flow: false,
  default_locale: "es",
  created_by: "profile-1",
};

function queryBuilder(result: { data?: unknown; count?: number; error?: unknown }) {
  const builder = {
    select: vi.fn(() => builder),
    is: vi.fn(() => builder),
    or: vi.fn(() => builder),
    order: vi.fn(() => builder),
    range: vi.fn(() => Promise.resolve({ data: result.data ?? null, error: result.error ?? null })),
    in: vi.fn(() => Promise.resolve({ data: result.data ?? null, error: result.error ?? null })),
    then: (
      onFulfilled: (value: { count: number; error: unknown }) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve({ count: result.count ?? 0, error: result.error ?? null }).then(onFulfilled, onRejected),
  };
  return builder;
}

function clientWith(results: Record<string, { data?: unknown; count?: number; error?: unknown }>) {
  return {
    from: vi.fn((table: string) => queryBuilder(results[table] ?? { data: [] })),
  } as unknown as SupabaseClient;
}

describe("loadPaginatedAdminEvents", () => {
  it("shows the creator surname first", async () => {
    // REGRESSION CHECK: The list name must stay surname-first. Do not join every profile.
    const client = clientWith({
      events: { data: [EVENT_ROW], count: 1 },
      event_attendees: { data: [] },
      profiles: { data: [{ id: "profile-1", first_name: "Ana", last_name: "Pérez" }] },
    });

    const result = await loadPaginatedAdminEvents(client, { page: 1 });

    expect(result.rows[0]?.createdByName).toBe("Pérez Ana");
    const from = (client.from as ReturnType<typeof vi.fn>);
    const profileCall = from.mock.calls.filter((call) => call[0] === "profiles");
    expect(profileCall).toHaveLength(1);
  });
});
