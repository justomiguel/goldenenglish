/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { update, sendEventAttendeeNotification, notifyAdminsEventRegistered, scene } = vi.hoisted(() => ({
  update: vi.fn(),
  sendEventAttendeeNotification: vi.fn(async () => true),
  notifyAdminsEventRegistered: vi.fn(async () => undefined),
  scene: {
    rpcNames: [] as string[],
    row: {
      attendee_id: "att-1" as string | null,
      attendee_status: "confirmed" as string | null,
      payment_required: false,
      payment_id: null as string | null,
      result_code: "confirmed",
      seats: 1,
      total_amount: 0,
    },
    updateError: null as { message: string } | null,
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc: async (name: string) => {
      scene.rpcNames.push(name);
      return {
        data: scene.row.attendee_id === "missing-row" ? [] : [scene.row],
        error: scene.row.result_code === "rpc_error" ? { message: "rpc" } : null,
      };
    },
    from: () => ({
      update: (...args: unknown[]) => {
        update(...args);
        return { eq: async () => ({ error: scene.updateError }) };
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

vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
}));

import { enrollEventAttendeeServer } from "@/lib/events/server/enrollEventAttendeeServer";

const input = {
  eventId: "event-1",
  firstName: "Ana",
  lastName: "Pérez",
  dniOrPassport: "1",
  email: "ana@example.com",
  source: "public" as const,
  fieldValues: [],
  locale: "en",
  registrationFlow: { id: "flow-1", price: null },
};

describe("enrollEventAttendeeServer mail", () => {
  beforeEach(() => {
    scene.row = {
      attendee_id: "att-1",
      attendee_status: "confirmed",
      payment_required: false,
      payment_id: null,
      result_code: "confirmed",
      seats: 1,
      total_amount: 0,
    };
    scene.updateError = null;
    scene.rpcNames = [];
    update.mockClear();
    sendEventAttendeeNotification.mockClear();
    notifyAdminsEventRegistered.mockClear();
  });

  it("stores the page locale and sends the registration mail", async () => {
    const result = await enrollEventAttendeeServer(input);
    expect(result.attendeeId).toBe("att-1");
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        registration_locale: "en",
        registration_flow_id: "flow-1",
      }),
    );
    expect(sendEventAttendeeNotification).toHaveBeenCalledWith({
      attendeeId: "att-1",
      templateKey: "events.registered",
    });
    expect(notifyAdminsEventRegistered).toHaveBeenCalledTimes(1);
    expect(notifyAdminsEventRegistered).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: "event-1",
        firstName: "Ana",
        lastName: "Pérez",
        seatCount: 1,
        paymentPending: false,
        locale: "en",
      }),
    );
  });

  it("does not send when enrollment does not succeed", async () => {
    scene.row.result_code = "insufficient_seats";
    await enrollEventAttendeeServer(input);
    scene.row = { ...scene.row, attendee_id: null, result_code: "confirmed" };
    await enrollEventAttendeeServer(input);
    scene.row = { ...scene.row, attendee_id: "missing-row", result_code: "rpc_error" };
    const failed = await enrollEventAttendeeServer(input);
    expect(failed.resultCode).toBe("rpc_error");
    expect(sendEventAttendeeNotification).not.toHaveBeenCalled();
    expect(notifyAdminsEventRegistered).not.toHaveBeenCalled();
  });

  it("stores a charged flow status and still sends after a failed locale update", async () => {
    const charged = await enrollEventAttendeeServer({
      ...input,
      locale: undefined,
      registrationFlow: { id: "flow-1", price: 10 },
    });
    expect(charged.attendeeStatus).toBe("pending_payment");
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ registration_locale: "es", status: "pending_payment" }),
    );

    scene.row.attendee_status = "waitlist";
    scene.row.result_code = "waitlist";
    scene.updateError = { message: "locale" };
    const waiting = await enrollEventAttendeeServer({
      ...input,
      registrationFlow: { id: "flow-1", price: 10 },
    });
    expect(waiting.attendeeStatus).toBe("waitlist");
    expect(sendEventAttendeeNotification).toHaveBeenCalled();
  });

  it("does not mail admins for a waitlist seat", async () => {
    scene.row.attendee_status = "waitlist";
    scene.row.result_code = "waitlist";
    await enrollEventAttendeeServer(input);
    expect(sendEventAttendeeNotification).toHaveBeenCalled();
    expect(notifyAdminsEventRegistered).not.toHaveBeenCalled();
  });

  it("stores the locale when the event has no flow", async () => {
    await enrollEventAttendeeServer({ ...input, registrationFlow: null });
    expect(update).toHaveBeenCalledWith({
      registration_locale: "en",
      family_discount_claimed: false,
      minor_ticket_count: 0,
    });
  });

  it("stores the family claim and returns 90% of the flow total", async () => {
    scene.row.total_amount = 10000;
    const result = await enrollEventAttendeeServer({
      ...input,
      registrationFlow: { id: "flow-1", price: 10000 },
      familyDiscountClaimed: true,
      currency: "CLP",
    });

    expect(result.totalAmount).toBe(9000);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ family_discount_claimed: true }),
    );
  });

  it("reserves a code in the same enroll call and keeps the database amount", async () => {
    scene.row.total_amount = 5000;
    scene.row.attendee_status = "payment_pending";
    scene.row.payment_required = true;
    scene.row.result_code = "payment_pending";
    const result = await enrollEventAttendeeServer({
      ...input,
      discountCode: " SAVE10 ",
      familyDiscountClaimed: false,
      registrationFlow: { id: "flow-1", price: 10000 },
      currency: "CLP",
    });
    expect(scene.rpcNames).toEqual(["enroll_event_attendee_with_discount"]);
    expect(result.totalAmount).toBe(5000);
    expect(result.attendeeStatus).toBe("payment_pending");
    expect(update).toHaveBeenCalledWith(
      expect.not.objectContaining({ status: "pending_payment" }),
    );
  });

  it("rejects a family claim sent with a code before any enroll call", async () => {
    const result = await enrollEventAttendeeServer({
      ...input,
      discountCode: "SAVE10",
      familyDiscountClaimed: true,
    });
    expect(result.resultCode).toBe("discount_conflict");
    expect(scene.rpcNames).toEqual([]);
    expect(update).not.toHaveBeenCalled();
  });

  it("returns no_uses from the database when the code is full", async () => {
    scene.row.attendee_id = null;
    scene.row.result_code = "no_uses";
    const result = await enrollEventAttendeeServer({ ...input, discountCode: "SAVE10" });
    expect(result.resultCode).toBe("no_uses");
    expect(result.attendeeId).toBeNull();
    expect(sendEventAttendeeNotification).not.toHaveBeenCalled();
  });
});
