import { describe, expect, it } from "vitest";
import {
  eventUsesPackages,
  resolveEventRegistrationTotal,
  resolveEventSeatPrice,
} from "@/lib/events/resolveEventRegistrationTotal";

describe("eventUsesPackages", () => {
  it("says yes as soon as there is one active package", () => {
    expect(eventUsesPackages([{ id: "p1" }])).toBe(true);
  });

  it("says no for an event with none", () => {
    expect(eventUsesPackages([])).toBe(false);
  });
});

describe("resolveEventSeatPrice", () => {
  const tiered = { priceLocal: 1000, priceNonLocal: 2500 };

  it("lets the package price win over the residency tiers", () => {
    expect(resolveEventSeatPrice(tiered, { price: 7000 }, true)).toBe(7000);
    expect(resolveEventSeatPrice(tiered, { price: 7000 }, false)).toBe(7000);
  });

  it("honours a free package instead of falling back to a tier", () => {
    // The bug this guards against is `package.price || tierPrice`, which would
    // charge a resident 1000 for a package the event gives away.
    expect(resolveEventSeatPrice(tiered, { price: 0 }, true)).toBe(0);
  });

  it("falls back to exactly today's residency behaviour with no package", () => {
    expect(resolveEventSeatPrice(tiered, null, true)).toBe(1000);
    expect(resolveEventSeatPrice(tiered, null, false)).toBe(2500);
    expect(resolveEventSeatPrice({ price: 500 }, null, false)).toBe(500);
    expect(resolveEventSeatPrice({}, null, true)).toBeNull();
  });
});

describe("resolveEventRegistrationTotal", () => {
  const multi = { allowMultipleTickets: true, maxTicketsPerRegistration: 4 };

  it("multiplies the unit price by the seats", () => {
    expect(resolveEventRegistrationTotal({ unitPrice: 2500, seats: 3, ...multi })).toEqual({
      ok: true,
      seats: 3,
      total: 7500,
    });
  });

  it("keeps a free package free however many seats it is", () => {
    expect(resolveEventRegistrationTotal({ unitPrice: 0, seats: 3, ...multi })).toEqual({
      ok: true,
      seats: 3,
      total: 0,
    });
  });

  it("treats an unpriced event as zero rather than NaN", () => {
    expect(resolveEventRegistrationTotal({ unitPrice: null, seats: 2, ...multi })).toEqual({
      ok: true,
      seats: 2,
      total: 0,
    });
  });

  it("rejects fewer than one seat", () => {
    expect(resolveEventRegistrationTotal({ unitPrice: 100, seats: 0, ...multi })).toEqual({
      ok: false,
      reason: "seats_below_one",
    });
  });

  it("rejects extra seats when the event sells one at a time", () => {
    expect(
      resolveEventRegistrationTotal({
        unitPrice: 100,
        seats: 2,
        allowMultipleTickets: false,
        maxTicketsPerRegistration: null,
      }),
    ).toEqual({ ok: false, reason: "multiple_not_allowed" });
  });

  it("still sells a single seat when the event sells one at a time", () => {
    expect(
      resolveEventRegistrationTotal({
        unitPrice: 100,
        seats: 1,
        allowMultipleTickets: false,
        maxTicketsPerRegistration: null,
      }),
    ).toEqual({ ok: true, seats: 1, total: 100 });
  });

  it("rejects over the maximum and accepts exactly at it", () => {
    expect(resolveEventRegistrationTotal({ unitPrice: 100, seats: 5, ...multi })).toEqual({
      ok: false,
      reason: "over_max",
    });
    expect(resolveEventRegistrationTotal({ unitPrice: 100, seats: 4, ...multi })).toEqual({
      ok: true,
      seats: 4,
      total: 400,
    });
  });

  it("treats a missing maximum as one seat, never as unlimited", () => {
    expect(
      resolveEventRegistrationTotal({
        unitPrice: 100,
        seats: 2,
        allowMultipleTickets: true,
        maxTicketsPerRegistration: null,
      }),
    ).toEqual({ ok: false, reason: "over_max" });
  });
});
