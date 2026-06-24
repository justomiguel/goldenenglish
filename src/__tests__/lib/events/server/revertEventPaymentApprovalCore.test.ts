import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
}));

import { revertEventPaymentApprovalCore } from "@/lib/events/server/revertEventPaymentApprovalCore";

describe("revertEventPaymentApprovalCore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reverts an approved manual bank transfer and rolls the attendee back", async () => {
    const paymentUpdate = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          is: vi.fn(() => ({
            select: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({ data: { id: "pay-1" }, error: null })),
            })),
          })),
        })),
      })),
    }));

    const attendeeUpdate = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: { id: "att-1" }, error: null })),
          })),
        })),
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
                    status: "approved",
                    gateway_provider: null,
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

    const result = await revertEventPaymentApprovalCore({
      admin: admin as never,
      paymentId: "pay-1",
      reviewedBy: "admin-1",
      reviewNotes: "Wrong receipt",
    });

    expect(result).toEqual({
      ok: true,
      paymentReverted: true,
      attendeeReverted: true,
    });
    expect(paymentUpdate).toHaveBeenCalled();
    expect(attendeeUpdate).toHaveBeenCalled();
  });

  it("returns not_found when payment does not exist", async () => {
    const admin = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
          })),
        })),
      })),
    };

    const result = await revertEventPaymentApprovalCore({
      admin: admin as never,
      paymentId: "missing",
      reviewedBy: "admin-1",
    });

    expect(result).toEqual({ ok: false, code: "not_found" });
  });

  it("rejects non-approved payments", async () => {
    const admin = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data: {
                id: "pay-3",
                status: "pending",
                gateway_provider: null,
                event_attendee_id: "att-3",
              },
              error: null,
            })),
          })),
        })),
      })),
    };

    const result = await revertEventPaymentApprovalCore({
      admin: admin as never,
      paymentId: "pay-3",
      reviewedBy: "admin-1",
    });

    expect(result).toEqual({ ok: false, code: "not_revertible" });
  });

  it("rejects gateway-approved payments", async () => {
    const admin = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data: {
                id: "pay-2",
                status: "approved",
                gateway_provider: "mercadopago",
                event_attendee_id: "att-2",
              },
              error: null,
            })),
          })),
        })),
      })),
    };

    const result = await revertEventPaymentApprovalCore({
      admin: admin as never,
      paymentId: "pay-2",
      reviewedBy: "admin-1",
    });

    expect(result).toEqual({ ok: false, code: "not_revertible" });
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

    const result = await revertEventPaymentApprovalCore({
      admin: admin as never,
      paymentId: "pay-1",
      reviewedBy: "admin-1",
    });

    expect(result).toEqual({ ok: false, code: "update_failed" });
  });
});
