import { beforeEach, describe, expect, it, vi } from "vitest";

const mockMarkApproved = vi.fn();
const mockRevertCore = vi.fn();

vi.mock("@/lib/events/server/markEventPaymentApprovedCore", () => ({
  markEventPaymentApprovedCore: (...args: unknown[]) => mockMarkApproved(...args),
}));

vi.mock("@/lib/events/server/revertEventPaymentApprovalCore", () => ({
  revertEventPaymentApprovalCore: (...args: unknown[]) => mockRevertCore(...args),
}));

vi.mock("@/lib/audit", () => ({
  auditFinanceAction: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerWarn: vi.fn(),
  logSupabaseClientError: vi.fn(),
}));

import {
  approveEventPayment,
  rejectEventPayment,
  revertEventPaymentApproval,
} from "@/lib/events/server/reviewEventPaymentServer";

describe("reviewEventPaymentServer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMarkApproved.mockResolvedValue({ ok: true, paymentId: "pay-1", paymentUpdated: true, attendeeConfirmed: true });
    mockRevertCore.mockResolvedValue({ ok: true, paymentReverted: true, attendeeReverted: true });
  });

  function paymentSelectRow(data: object | null) {
    return {
      from: vi.fn((table: string) => {
        if (table === "event_payments") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({ data, error: null })),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(async () => ({ error: null })),
            })),
          };
        }
        throw new Error(`unexpected table ${table}`);
      }),
    };
  }

  it("approveEventPayment delegates to markEventPaymentApprovedCore", async () => {
    const adminClient = paymentSelectRow({ status: "pending", review_notes: null });

    const result = await approveEventPayment({
      adminClient: adminClient as never,
      actorId: "admin-1",
      paymentId: "pay-1",
      notes: "Looks good",
    });

    expect(result).toEqual({ ok: true });
    expect(mockMarkApproved).toHaveBeenCalled();
  });

  it("approveEventPayment returns ok false when core fails", async () => {
    mockMarkApproved.mockResolvedValue({ ok: false, code: "not_found" });
    const adminClient = paymentSelectRow({ status: "pending", review_notes: null });

    const result = await approveEventPayment({
      adminClient: adminClient as never,
      actorId: "admin-1",
      paymentId: "pay-1",
    });

    expect(result).toEqual({ ok: false });
  });

  it("rejectEventPayment updates the payment row", async () => {
    const update = vi.fn(() => ({
      eq: vi.fn(async () => ({ error: null })),
    }));
    const adminClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: { status: "pending", review_notes: null }, error: null })),
          })),
        })),
        update,
      })),
    };

    const result = await rejectEventPayment({
      adminClient: adminClient as never,
      actorId: "admin-1",
      paymentId: "pay-1",
      notes: "Mismatch",
    });

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalled();
  });

  it("rejectEventPayment returns ok false when update errors", async () => {
    const adminClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: { status: "pending", review_notes: null }, error: null })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(async () => ({ error: { message: "db down" } })),
        })),
      })),
    };

    const result = await rejectEventPayment({
      adminClient: adminClient as never,
      actorId: "admin-1",
      paymentId: "pay-1",
      notes: "Mismatch",
    });

    expect(result).toEqual({ ok: false });
  });

  it("revertEventPaymentApproval delegates to revert core", async () => {
    const adminClient = paymentSelectRow({
      status: "approved",
      review_notes: null,
      event_attendee_id: "att-1",
    });

    const result = await revertEventPaymentApproval({
      adminClient: adminClient as never,
      actorId: "admin-1",
      paymentId: "pay-1",
      notes: "Wrong receipt",
    });

    expect(result).toEqual({ ok: true });
    expect(mockRevertCore).toHaveBeenCalled();
  });

  it("revertEventPaymentApproval surfaces not_revertible", async () => {
    mockRevertCore.mockResolvedValue({ ok: false, code: "not_revertible" });
    const adminClient = paymentSelectRow({
      status: "approved",
      review_notes: null,
      event_attendee_id: "att-1",
    });

    const result = await revertEventPaymentApproval({
      adminClient: adminClient as never,
      actorId: "admin-1",
      paymentId: "pay-1",
    });

    expect(result).toEqual({ ok: false, code: "not_revertible" });
  });
});
