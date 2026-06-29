import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
}));

import { loadEventAttendeeGatewayContext } from "@/lib/events/server/loadEventAttendeeGatewayContext";

function makeAdmin(result: { data: unknown; error: unknown }) {
  return {
    from: vi.fn(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => result,
        }),
      }),
    })),
  } as never;
}

const baseRow = {
  id: "att-1",
  status: "pending_payment",
  is_local_resident: true,
  email: "payer@example.com",
  dni_or_passport: "12345678",
  event_id: "evt-1",
  events: {
    slug: "winter-camp",
    title: "Winter Camp",
    currency: "CLP",
    price: 10000,
    price_local: 10000,
    price_non_local: 20000,
  },
};

describe("loadEventAttendeeGatewayContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves the local-resident price tier", async () => {
    const admin = makeAdmin({ data: baseRow, error: null });

    const context = await loadEventAttendeeGatewayContext(admin, "att-1");

    expect(context).toEqual(
      expect.objectContaining({
        attendeeId: "att-1",
        eventId: "evt-1",
        attendeeStatus: "pending_payment",
        isLocalResident: true,
        currency: "CLP",
        amount: 10000,
        slug: "winter-camp",
      }),
    );
  });

  it("resolves the non-local price tier", async () => {
    const admin = makeAdmin({
      data: { ...baseRow, is_local_resident: false },
      error: null,
    });

    const context = await loadEventAttendeeGatewayContext(admin, "att-1");

    expect(context?.amount).toBe(20000);
    expect(context?.isLocalResident).toBe(false);
  });

  it("treats a null residency flag as local", async () => {
    const admin = makeAdmin({
      data: { ...baseRow, is_local_resident: null },
      error: null,
    });

    const context = await loadEventAttendeeGatewayContext(admin, "att-1");

    expect(context?.isLocalResident).toBe(true);
    expect(context?.amount).toBe(10000);
  });

  it("unwraps an event returned as an array (PostgREST embed)", async () => {
    const admin = makeAdmin({
      data: { ...baseRow, events: [baseRow.events] },
      error: null,
    });

    const context = await loadEventAttendeeGatewayContext(admin, "att-1");

    expect(context?.title).toBe("Winter Camp");
  });

  it("returns null when the attendee is not found", async () => {
    const admin = makeAdmin({ data: null, error: null });

    expect(await loadEventAttendeeGatewayContext(admin, "missing")).toBeNull();
  });

  it("returns null on a query error", async () => {
    const admin = makeAdmin({ data: null, error: { message: "boom" } });

    expect(await loadEventAttendeeGatewayContext(admin, "att-1")).toBeNull();
  });
});
