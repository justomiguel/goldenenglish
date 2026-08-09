import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
}));

import { loadEventAttendeeGatewayContext } from "@/lib/events/server/loadEventAttendeeGatewayContext";

/**
 * Two queries now: the attendee itself, then the companions sharing its purchase.
 * The mock answers `maybeSingle()` with the first and the `in("status", ...)`
 * chain with the second.
 */
function makeAdmin(
  result: { data: unknown; error: unknown },
  companions: { data: unknown; error: unknown } = { data: [], error: null },
) {
  const statusFilter = vi.fn();
  const admin = {
    from: vi.fn(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => result,
          in: async (...args: unknown[]) => {
            statusFilter(...args);
            return companions;
          },
        }),
      }),
    })),
  } as never;
  return { admin, statusFilter };
}

const baseRow = {
  id: "att-1",
  status: "pending_payment",
  is_local_resident: true,
  email: "payer@example.com",
  dni_or_passport: "12345678",
  event_id: "evt-1",
  primary_attendee_id: null,
  ticket_package_id: null,
  event_ticket_packages: null,
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
    const { admin } = makeAdmin({ data: baseRow, error: null });

    const context = await loadEventAttendeeGatewayContext(admin, "att-1");

    expect(context).toEqual(
      expect.objectContaining({
        attendeeId: "att-1",
        eventId: "evt-1",
        attendeeStatus: "pending_payment",
        isLocalResident: true,
        currency: "CLP",
        amount: 10000,
        seats: 1,
        slug: "winter-camp",
      }),
    );
  });

  it("resolves the non-local price tier", async () => {
    const { admin } = makeAdmin({
      data: { ...baseRow, is_local_resident: false },
      error: null,
    });

    const context = await loadEventAttendeeGatewayContext(admin, "att-1");

    expect(context?.amount).toBe(20000);
    expect(context?.isLocalResident).toBe(false);
  });

  it("treats a null residency flag as local", async () => {
    const { admin } = makeAdmin({
      data: { ...baseRow, is_local_resident: null },
      error: null,
    });

    const context = await loadEventAttendeeGatewayContext(admin, "att-1");

    expect(context?.isLocalResident).toBe(true);
    expect(context?.amount).toBe(10000);
  });

  it("unwraps an event returned as an array (PostgREST embed)", async () => {
    const { admin } = makeAdmin({
      data: { ...baseRow, events: [baseRow.events] },
      error: null,
    });

    const context = await loadEventAttendeeGatewayContext(admin, "att-1");

    expect(context?.title).toBe("Winter Camp");
  });

  it("returns null when the attendee is not found", async () => {
    const { admin } = makeAdmin({ data: null, error: null });

    expect(await loadEventAttendeeGatewayContext(admin, "missing")).toBeNull();
  });

  it("returns null on a query error", async () => {
    const { admin } = makeAdmin({ data: null, error: { message: "boom" } });

    expect(await loadEventAttendeeGatewayContext(admin, "att-1")).toBeNull();
  });

  describe("packages and companions", () => {
    const withPackage = {
      ...baseRow,
      ticket_package_id: "pkg-1",
      event_ticket_packages: { price: 5000 },
    };

    it("charges the package price times the seats", async () => {
      const { admin } = makeAdmin(
        { data: withPackage, error: null },
        { data: [{ id: "c1" }, { id: "c2" }], error: null },
      );

      const context = await loadEventAttendeeGatewayContext(admin, "att-1");

      expect(context?.seats).toBe(3);
      expect(context?.amount).toBe(15000);
    });

    it("lets the package price override the residency tier", async () => {
      const { admin } = makeAdmin({
        data: { ...withPackage, is_local_resident: false },
        error: null,
      });

      expect((await loadEventAttendeeGatewayContext(admin, "att-1"))?.amount).toBe(5000);
    });

    it("refuses to build a context for a companion", async () => {
      // event_payments.event_attendee_id is unique per attendee, so without this
      // guard a companion could open a second checkout for the same purchase.
      const { admin } = makeAdmin({
        data: { ...withPackage, id: "att-2", primary_attendee_id: "att-1" },
        error: null,
      });

      expect(await loadEventAttendeeGatewayContext(admin, "att-2")).toBeNull();
    });

    it("stops charging for companions that were cancelled", async () => {
      const { admin, statusFilter } = makeAdmin(
        { data: withPackage, error: null },
        { data: [{ id: "c1" }], error: null },
      );

      const context = await loadEventAttendeeGatewayContext(admin, "att-1");

      expect(statusFilter).toHaveBeenCalledWith("status", ["confirmed", "pending_payment"]);
      expect(context?.seats).toBe(2);
      expect(context?.amount).toBe(10000);
    });

    it("multiplies the residency price too when there is no package", async () => {
      const { admin } = makeAdmin(
        { data: baseRow, error: null },
        { data: [{ id: "c1" }], error: null },
      );

      const context = await loadEventAttendeeGatewayContext(admin, "att-1");

      expect(context?.seats).toBe(2);
      expect(context?.amount).toBe(20000);
    });
  });
});
