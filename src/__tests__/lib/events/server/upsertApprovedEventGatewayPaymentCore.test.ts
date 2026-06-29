import { beforeEach, describe, expect, it, vi } from "vitest";

const mockMarkApproved = vi.fn();
const mockLoadContext = vi.fn();

vi.mock("@/lib/events/server/markEventPaymentApprovedCore", () => ({
  markEventPaymentApprovedCore: (...args: unknown[]) => mockMarkApproved(...args),
}));

vi.mock("@/lib/events/server/loadEventAttendeeGatewayContext", () => ({
  loadEventAttendeeGatewayContext: (...args: unknown[]) => mockLoadContext(...args),
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
}));

import { upsertApprovedEventGatewayPaymentCore } from "@/lib/events/server/upsertApprovedEventGatewayPaymentCore";

interface AdminOptions {
  reads?: Array<{ data: unknown; error: unknown }>;
  insertResult?: { data: unknown; error: unknown };
}

function makeAdmin(opts: AdminOptions = {}) {
  const reads = [...(opts.reads ?? [])];
  const insertResult = opts.insertResult ?? { data: { id: "new-pay" }, error: null };
  const insertSpy = vi.fn();
  const updateSpy = vi.fn(async () => ({ error: null }));

  const admin = {
    from: vi.fn(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => reads.shift() ?? { data: null, error: null },
        }),
      }),
      insert: (payload: unknown) => {
        insertSpy(payload);
        return {
          select: () => ({
            maybeSingle: async () => insertResult,
          }),
        };
      },
      update: (payload: unknown) => ({
        eq: () => ({
          is: () => updateSpy(payload),
        }),
      }),
    })),
  };

  return { admin: admin as never, insertSpy, updateSpy };
}

describe("upsertApprovedEventGatewayPaymentCore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMarkApproved.mockResolvedValue({
      ok: true,
      paymentId: "pay-1",
      paymentUpdated: true,
      attendeeConfirmed: true,
    });
    mockLoadContext.mockResolvedValue({
      attendeeId: "att-1",
      amount: 15000,
      currency: "CLP",
    });
  });

  it("approves an existing pending payment without inserting a new row", async () => {
    const { admin, insertSpy } = makeAdmin({
      reads: [{ data: { id: "pay-1", status: "pending" }, error: null }],
    });

    const result = await upsertApprovedEventGatewayPaymentCore({
      admin,
      attendeeId: "att-1",
      gatewayProvider: "mercadopago",
    });

    expect(result).toEqual({ ok: true, paymentId: "pay-1" });
    expect(insertSpy).not.toHaveBeenCalled();
    expect(mockMarkApproved).toHaveBeenCalledWith(
      expect.objectContaining({ paymentId: "pay-1", gatewayProvider: "mercadopago" }),
    );
  });

  it("materializes a new payment when none exists yet (deferred creation)", async () => {
    const { admin, insertSpy } = makeAdmin({
      reads: [{ data: null, error: null }],
      insertResult: { data: { id: "new-pay" }, error: null },
    });

    const result = await upsertApprovedEventGatewayPaymentCore({
      admin,
      attendeeId: "att-1",
      gatewayProvider: "flow",
    });

    expect(result).toEqual({ ok: true, paymentId: "new-pay" });
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        event_attendee_id: "att-1",
        amount: 15000,
        currency: "CLP",
        status: "pending",
        gateway_provider: "flow",
      }),
    );
    expect(mockMarkApproved).toHaveBeenCalledWith(
      expect.objectContaining({ paymentId: "new-pay", gatewayProvider: "flow" }),
    );
  });

  it("skips when the attendee context is missing", async () => {
    mockLoadContext.mockResolvedValue(null);
    const { admin, insertSpy } = makeAdmin({ reads: [{ data: null, error: null }] });

    const result = await upsertApprovedEventGatewayPaymentCore({
      admin,
      attendeeId: "att-missing",
      gatewayProvider: "mercadopago",
    });

    expect(result).toEqual({ ok: true, skipped: "event_attendee_not_found" });
    expect(insertSpy).not.toHaveBeenCalled();
    expect(mockMarkApproved).not.toHaveBeenCalled();
  });

  it("returns ok false when the existing-payment lookup errors", async () => {
    const { admin } = makeAdmin({
      reads: [{ data: null, error: { message: "boom" } }],
    });

    const result = await upsertApprovedEventGatewayPaymentCore({
      admin,
      attendeeId: "att-1",
      gatewayProvider: "flow",
    });

    expect(result).toEqual({ ok: false });
  });

  it("recovers from a concurrent insert race via the unique attendee constraint", async () => {
    const { admin, insertSpy } = makeAdmin({
      reads: [
        { data: null, error: null },
        { data: { id: "raced-pay", status: "pending" }, error: null },
      ],
      insertResult: { data: null, error: { message: "duplicate key" } },
    });

    const result = await upsertApprovedEventGatewayPaymentCore({
      admin,
      attendeeId: "att-1",
      gatewayProvider: "mercadopago",
    });

    expect(result).toEqual({ ok: true, paymentId: "raced-pay" });
    expect(insertSpy).toHaveBeenCalled();
    expect(mockMarkApproved).toHaveBeenCalledWith(
      expect.objectContaining({ paymentId: "raced-pay" }),
    );
  });

  it("returns ok false when approval fails", async () => {
    mockMarkApproved.mockResolvedValue({ ok: false, code: "update_failed" });
    const { admin } = makeAdmin({
      reads: [{ data: { id: "pay-1", status: "pending" }, error: null }],
    });

    const result = await upsertApprovedEventGatewayPaymentCore({
      admin,
      attendeeId: "att-1",
      gatewayProvider: "flow",
    });

    expect(result).toEqual({ ok: false });
  });

  it("backfills mp_preference_id when provided", async () => {
    const { admin, updateSpy } = makeAdmin({
      reads: [{ data: { id: "pay-1", status: "pending" }, error: null }],
    });

    const result = await upsertApprovedEventGatewayPaymentCore({
      admin,
      attendeeId: "att-1",
      gatewayProvider: "mercadopago",
      mpPreferenceId: "pref-123",
    });

    expect(result).toEqual({ ok: true, paymentId: "pay-1" });
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ mp_preference_id: "pref-123" }),
    );
  });
});
