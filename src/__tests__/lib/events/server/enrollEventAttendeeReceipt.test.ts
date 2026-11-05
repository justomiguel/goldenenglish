/** @vitest-environment node */
// REGRESSION CHECK: transfer enrollment must not create a pending guest when the staged receipt is missing or the attach step fails.
import { beforeEach, describe, expect, it, vi } from "vitest";

const { update, sendEventAttendeeNotification, notifyAdminsEventRegistered, finalize, scene } =
  vi.hoisted(() => ({
    update: vi.fn(),
    sendEventAttendeeNotification: vi.fn(async () => true),
    notifyAdminsEventRegistered: vi.fn(async () => undefined),
    finalize: vi.fn(async () => ({ ok: true as const })),
    scene: { rpcNames: [] as string[] },
  }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc: async (name: string) => {
      scene.rpcNames.push(name);
      return {
        data: [
          {
            attendee_id: "att-1",
            attendee_status: "pending_payment",
            payment_required: true,
            payment_id: null,
            result_code: "payment_pending",
            seats: 1,
            total_amount: 10000,
          },
        ],
        error: null,
      };
    },
    from: () => ({
      update: (...args: unknown[]) => {
        update(...args);
        return { eq: async () => ({ error: null }) };
      },
      select: () => {
        const chain = {
          eq: () => chain,
          in: () => chain,
          maybeSingle: async () => ({ data: null, error: null }),
          then: (resolve: (value: unknown) => void) => resolve({ data: [], error: null }),
        };
        return chain;
      },
    }),
  }),
}));

vi.mock("@/lib/events/server/sendEventAttendeeNotification", () => ({
  sendEventAttendeeNotification: (...args: unknown[]) => sendEventAttendeeNotification(...args),
}));

vi.mock("@/lib/email/notifyAdminsPurchasePayment", () => ({
  notifyAdminsEventRegistered: (...args: unknown[]) => notifyAdminsEventRegistered(...args),
}));

vi.mock("@/lib/events/server/finalizeEventTransferReceipt", () => ({
  finalizeEventTransferReceipt: (...args: unknown[]) => finalize(...args),
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
  logServerWarn: vi.fn(),
  logServerActionException: vi.fn(),
}));

import { buildEventReceiptStagingPath } from "@/lib/events/eventRegistrationStagingPath";
import { enrollEventAttendeeServer } from "@/lib/events/server/enrollEventAttendeeServer";

const receiptPath = buildEventReceiptStagingPath({
  eventId: "event-1",
  email: "ana@example.com",
  dniOrPassport: "1",
  slug: "gala",
  filename: "pago.jpg",
  mime: "image/jpeg",
  now: 10,
});

const input = {
  eventId: "event-1",
  firstName: "Ana",
  lastName: "Pérez",
  dniOrPassport: "1",
  email: "ana@example.com",
  source: "public" as const,
  fieldValues: [],
  locale: "es",
  slug: "gala",
  registrationFlow: { id: "flow-1", price: 10000 },
  requireTransferReceipt: true,
  receiptStagingPath: receiptPath,
};

describe("enrollEventAttendeeServer receipt", () => {
  beforeEach(() => {
    scene.rpcNames = [];
    update.mockClear();
    sendEventAttendeeNotification.mockClear();
    notifyAdminsEventRegistered.mockClear();
    finalize.mockReset();
    finalize.mockResolvedValue({ ok: true });
  });

  it("does not enroll when the transfer receipt path is missing", async () => {
    const result = await enrollEventAttendeeServer({
      ...input,
      receiptStagingPath: null,
    });
    expect(result.resultCode).toBe("receipt_required");
    expect(scene.rpcNames).toEqual([]);
    expect(sendEventAttendeeNotification).not.toHaveBeenCalled();
  });

  it("mails only after the receipt is attached", async () => {
    const result = await enrollEventAttendeeServer(input);
    expect(result.attendeeId).toBe("att-1");
    expect(finalize).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ attendeeId: "att-1", stagingPath: receiptPath }),
    );
    expect(sendEventAttendeeNotification).toHaveBeenCalledTimes(1);
  });

  it("does not mail when attaching the receipt fails", async () => {
    finalize.mockResolvedValue({ ok: false, code: "storage_failed" });
    const result = await enrollEventAttendeeServer(input);
    expect(result.resultCode).toBe("receipt_attach_failed");
    expect(result.attendeeId).toBeNull();
    expect(sendEventAttendeeNotification).not.toHaveBeenCalled();
    expect(notifyAdminsEventRegistered).not.toHaveBeenCalled();
  });
});
