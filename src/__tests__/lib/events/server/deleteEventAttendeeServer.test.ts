import { describe, expect, it, vi, beforeEach } from "vitest";

const recordSystemAudit = vi.hoisted(() => vi.fn().mockResolvedValue({ ok: true }));
const sendEventAttendeeNotification = vi.hoisted(() => vi.fn(async () => true));

vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit,
}));

vi.mock("@/lib/events/server/sendEventAttendeeNotification", () => ({
  sendEventAttendeeNotification: (...args: unknown[]) => sendEventAttendeeNotification(...args),
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
  logServerWarn: vi.fn(),
}));

import { deleteEventAttendee } from "@/lib/events/server/deleteEventAttendeeServer";

function buildAdminClient(handlers: {
  attendee?: Record<string, unknown> | null;
  fieldValues?: Array<{ file_storage_path: string | null }>;
  deleteError?: { message: string } | null;
}) {
  const storageRemove = vi.fn().mockResolvedValue({ error: null });
  const deleteEq = vi.fn().mockResolvedValue({ error: handlers.deleteError ?? null });
  const from = vi.fn((table: string) => {
    if (table === "event_attendees") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: handlers.attendee ?? null, error: null }),
          }),
        }),
        delete: vi.fn().mockReturnValue({ eq: deleteEq }),
      };
    }
    if (table === "event_attendee_field_values") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: handlers.fieldValues ?? [], error: null }),
        }),
      };
    }
    throw new Error(`unexpected table ${table}`);
  });

  return {
    from,
    storage: { from: vi.fn().mockReturnValue({ remove: storageRemove }) },
    storageRemove,
    deleteEq,
  };
}

const mercadoPagoAttendee = {
  id: "att-mp",
  event_id: "evt-1",
  first_name: "Ana",
  last_name: "Pérez",
  email: "ana@example.com",
  dni_or_passport: "123",
  status: "confirmed",
  event_payments: {
    status: "approved",
    gateway_provider: "mercadopago",
    receipt_storage_path: null,
  },
};

describe("deleteEventAttendee", () => {
  beforeEach(() => {
    recordSystemAudit.mockClear();
    sendEventAttendeeNotification.mockReset();
    sendEventAttendeeNotification.mockResolvedValue(true);
  });

  it("deletes attendee with pending bank transfer and cleans storage", async () => {
    const admin = buildAdminClient({
      attendee: {
        id: "att-1",
        event_id: "evt-1",
        first_name: "Ana",
        last_name: "Pérez",
        email: "ana@example.com",
        dni_or_passport: "123",
        status: "pending_payment",
        event_payments: {
          status: "pending",
          gateway_provider: null,
          receipt_storage_path: "events/evt-1/receipt.pdf",
        },
      },
      fieldValues: [{ file_storage_path: "events/evt-1/file.pdf" }],
    });

    const result = await deleteEventAttendee({
      adminClient: admin as never,
      actorId: "admin-1",
      attendeeId: "att-1",
      eventId: "evt-1",
    });

    expect(result).toEqual({ ok: true });
    expect(sendEventAttendeeNotification).not.toHaveBeenCalled();
    expect(admin.storageRemove).toHaveBeenCalledWith([
      "events/evt-1/receipt.pdf",
      "events/evt-1/file.pdf",
    ]);
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "event_attendee_delete",
        resourceId: "att-1",
        payload: expect.objectContaining({ notified: false }),
      }),
    );
  });

  it("deletes an approved Mercado Pago registration without email when notify is off", async () => {
    const admin = buildAdminClient({ attendee: mercadoPagoAttendee });

    const result = await deleteEventAttendee({
      adminClient: admin as never,
      actorId: "admin-1",
      attendeeId: "att-mp",
      eventId: "evt-1",
      notify: false,
    });

    expect(result).toEqual({ ok: true });
    expect(sendEventAttendeeNotification).not.toHaveBeenCalled();
    expect(admin.deleteEq).toHaveBeenCalled();
  });

  it("emails the reason and then deletes when notify stays on", async () => {
    const admin = buildAdminClient({ attendee: mercadoPagoAttendee });

    const result = await deleteEventAttendee({
      adminClient: admin as never,
      actorId: "admin-1",
      attendeeId: "att-mp",
      eventId: "evt-1",
      notify: true,
      reason: "  Quedó duplicada  ",
    });

    expect(result).toEqual({ ok: true });
    expect(sendEventAttendeeNotification).toHaveBeenCalledWith({
      attendeeId: "att-mp",
      templateKey: "events.registration_removed",
      reason: "Quedó duplicada",
    });
    expect(admin.deleteEq).toHaveBeenCalled();
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ notified: true, reason: "Quedó duplicada" }),
      }),
    );
  });

  it("keeps the registration when the notice email fails", async () => {
    sendEventAttendeeNotification.mockResolvedValue(false);
    const admin = buildAdminClient({ attendee: mercadoPagoAttendee });

    const result = await deleteEventAttendee({
      adminClient: admin as never,
      actorId: "admin-1",
      attendeeId: "att-mp",
      eventId: "evt-1",
      notify: true,
      reason: "Cupo mal cargado",
    });

    expect(result).toEqual({ ok: false, code: "notify_failed" });
    expect(admin.deleteEq).not.toHaveBeenCalled();
    expect(recordSystemAudit).not.toHaveBeenCalled();
  });

  it("refuses a notice without a reason or without an email", async () => {
    const admin = buildAdminClient({ attendee: mercadoPagoAttendee });
    const missingReason = await deleteEventAttendee({
      adminClient: admin as never,
      actorId: "admin-1",
      attendeeId: "att-mp",
      eventId: "evt-1",
      notify: true,
      reason: "   ",
    });
    expect(missingReason).toEqual({ ok: false, code: "reason_required" });

    const noEmail = buildAdminClient({
      attendee: { ...mercadoPagoAttendee, email: "" },
    });
    const missingEmail = await deleteEventAttendee({
      adminClient: noEmail as never,
      actorId: "admin-1",
      attendeeId: "att-mp",
      eventId: "evt-1",
      notify: true,
      reason: "Cupo mal cargado",
    });
    expect(missingEmail).toEqual({ ok: false, code: "no_email" });
    expect(sendEventAttendeeNotification).not.toHaveBeenCalled();
  });
});
