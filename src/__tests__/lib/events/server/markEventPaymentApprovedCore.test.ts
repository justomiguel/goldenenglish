import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
}));

import { markEventPaymentApprovedCore } from "@/lib/events/server/markEventPaymentApprovedCore";

describe("markEventPaymentApprovedCore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("approves a pending payment and confirms the attendee", async () => {
    const attendeeUpdate = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: { id: "att-1" }, error: null })),
          })),
        })),
      })),
    }));

    const paymentUpdate = vi.fn(() => ({
      eq: vi.fn(() => ({
        in: vi.fn(async () => ({ error: null })),
      })),
    }));

    const admin = {
      from: vi.fn((table: string) => {
        if (table === "event_payments") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({
                  data: {
                    id: "pay-1",
                    status: "pending",
                    event_attendee_id: "att-1",
                  },
                  error: null,
                })),
              })),
            })),
            update: paymentUpdate,
          };
        }
        if (table === "event_attendees") {
          return { update: attendeeUpdate };
        }
        throw new Error(`unexpected table ${table}`);
      }),
    };

    const result = await markEventPaymentApprovedCore({
      admin: admin as never,
      paymentId: "pay-1",
      gatewayProvider: "mercadopago",
      paidAt: "2026-06-24T12:00:00.000Z",
    });

    expect(result).toEqual({
      ok: true,
      paymentId: "pay-1",
      paymentUpdated: true,
      attendeeConfirmed: true,
    });
    expect(paymentUpdate).toHaveBeenCalled();
    expect(attendeeUpdate).toHaveBeenCalled();
  });

  it("returns not_found when payment is missing", async () => {
    const admin = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
          })),
        })),
      })),
    };

    const result = await markEventPaymentApprovedCore({
      admin: admin as never,
      paymentId: "missing",
    });

    expect(result).toEqual({ ok: false, code: "not_found" });
  });

  it("returns update_failed when select errors", async () => {
    const admin = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: null, error: { message: "db down" } })),
          })),
        })),
      })),
    };

    const result = await markEventPaymentApprovedCore({
      admin: admin as never,
      paymentId: "pay-x",
    });

    expect(result).toEqual({ ok: false, code: "update_failed" });
  });

  it("returns update_failed when payment update errors", async () => {
    const admin = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data: {
                id: "pay-4",
                status: "pending",
                event_attendee_id: "att-4",
              },
              error: null,
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(async () => ({ error: { message: "update failed" } })),
          })),
        })),
      })),
    };

    const result = await markEventPaymentApprovedCore({
      admin: admin as never,
      paymentId: "pay-4",
    });

    expect(result).toEqual({ ok: false, code: "update_failed" });
  });

  it("confirms the attendee when the payment is already approved", async () => {
    const attendeeUpdate = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: { id: "att-2" }, error: null })),
          })),
        })),
      })),
    }));

    const paymentUpdate = vi.fn();

    const admin = {
      from: vi.fn((table: string) => {
        if (table === "event_payments") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({
                  data: {
                    id: "pay-2",
                    status: "approved",
                    event_attendee_id: "att-2",
                  },
                  error: null,
                })),
              })),
            })),
            update: paymentUpdate,
          };
        }
        if (table === "event_attendees") {
          return { update: attendeeUpdate };
        }
        throw new Error(`unexpected table ${table}`);
      }),
    };

    const result = await markEventPaymentApprovedCore({
      admin: admin as never,
      paymentId: "pay-2",
    });

    expect(result).toEqual({
      ok: true,
      paymentId: "pay-2",
      paymentUpdated: false,
      attendeeConfirmed: true,
    });
    expect(paymentUpdate).not.toHaveBeenCalled();
    expect(attendeeUpdate).toHaveBeenCalled();
  });
});
