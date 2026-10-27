/** @vitest-environment node */
// REGRESSION CHECK: enrollEventAttendeeServer must persist transfer_source_key,
// transfer_source_label, and transfer_question_answer on event_attendees when a dual transfer source is selected.
import { describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => {
  const updateEq = vi.fn(async () => ({ error: null }));
  const updateFn = vi.fn(() => ({ eq: updateEq }));
  const rpcFn = vi.fn(async () => ({
    data: [
      {
        attendee_id: "att-1",
        attendee_status: "pending_payment",
        payment_required: true,
        payment_id: null,
        result_code: "payment_pending",
        seats: 1,
        total_amount: 15000,
      },
    ],
    error: null,
  }));
  return { updateEq, updateFn, rpcFn };
});

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(async () => ({
    rpc: hoisted.rpcFn,
    from: vi.fn(() => ({
      update: hoisted.updateFn,
    })),
  })),
}));

vi.mock("@/lib/events/server/sendEventAttendeeNotification", () => ({
  sendEventAttendeeNotification: vi.fn(async () => undefined),
}));

vi.mock("@/lib/email/notifyAdminsPurchasePayment", () => ({
  notifyAdminsEventRegistered: vi.fn(async () => undefined),
}));

import { enrollEventAttendeeServer } from "@/lib/events/server/enrollEventAttendeeServer";

describe("enrollEventAttendeeServer dual transfer persistence", () => {
  it("persists transfer_source_key, transfer_source_label, and transfer_question_answer on event_attendees", async () => {
    const result = await enrollEventAttendeeServer({
      eventId: "ev-1",
      firstName: "Ana",
      lastName: "Pérez",
      dniOrPassport: "12345678",
      email: "ana@example.com",
      source: "public",
      fieldValues: [],
      locale: "es",
      transferSelection: {
        sourceKey: "source_2",
        sourceLabel: "Instituto Nago",
        questionAnswer: "Soy alumno de Nago",
      },
    });

    expect(result.attendeeId).toBe("att-1");
    expect(hoisted.updateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        transfer_source_key: "source_2",
        transfer_source_label: "Instituto Nago",
        transfer_question_answer: "Soy alumno de Nago",
      }),
    );
    expect(hoisted.updateEq).toHaveBeenCalledWith("id", "att-1");
  });
});
