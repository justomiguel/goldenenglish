/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { update, sendEventAttendeeNotification, scene } = vi.hoisted(() => ({
  update: vi.fn(),
  sendEventAttendeeNotification: vi.fn(async () => true),
  scene: {
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
    rpc: async () => ({
      data: scene.row.attendee_id === "missing-row" ? [] : [scene.row],
      error: scene.row.result_code === "rpc_error" ? { message: "rpc" } : null,
    }),
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
    update.mockClear();
    sendEventAttendeeNotification.mockClear();
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

  it("stores the locale when the event has no flow", async () => {
    await enrollEventAttendeeServer({ ...input, registrationFlow: null });
    expect(update).toHaveBeenCalledWith({ registration_locale: "en" });
  });
});
