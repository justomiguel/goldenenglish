import { describe, expect, it, vi, beforeEach } from "vitest";

const recordSystemAudit = vi.hoisted(() => vi.fn().mockResolvedValue({ ok: true }));

vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit,
}));

import { deleteEventAttendee } from "@/lib/events/server/deleteEventAttendeeServer";

function buildAdminClient(handlers: {
  attendee?: Record<string, unknown> | null;
  fieldValues?: Array<{ file_storage_path: string | null }>;
  deleteError?: { message: string } | null;
}) {
  const storageRemove = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn((table: string) => {
    if (table === "event_attendees") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: handlers.attendee ?? null, error: null }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: handlers.deleteError ?? null }),
        }),
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
  };
}

describe("deleteEventAttendee", () => {
  beforeEach(() => {
    recordSystemAudit.mockClear();
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
    expect(admin.storageRemove).toHaveBeenCalledWith([
      "events/evt-1/receipt.pdf",
      "events/evt-1/file.pdf",
    ]);
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "event_attendee_delete", resourceId: "att-1" }),
    );
  });

  it("blocks delete when payment is approved", async () => {
    const admin = buildAdminClient({
      attendee: {
        id: "att-2",
        event_id: "evt-1",
        first_name: "Luis",
        last_name: "Díaz",
        email: "luis@example.com",
        dni_or_passport: "456",
        status: "confirmed",
        event_payments: {
          status: "approved",
          gateway_provider: null,
          receipt_storage_path: null,
        },
      },
    });

    const result = await deleteEventAttendee({
      adminClient: admin as never,
      actorId: "admin-1",
      attendeeId: "att-2",
      eventId: "evt-1",
    });

    expect(result).toEqual({ ok: false, code: "not_deletable" });
    expect(recordSystemAudit).not.toHaveBeenCalled();
  });
});
