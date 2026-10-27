import { describe, expect, it, vi } from "vitest";
import { deleteEventPayment } from "@/lib/events/server/deleteEventPaymentServer";

vi.mock("@/lib/audit", () => ({
  auditFinanceAction: vi.fn(async () => ({ ok: true })),
}));

const releaseEventDiscountRedemption = vi.fn(async () => undefined);

vi.mock("@/lib/events/server/syncEventDiscountRedemption", () => ({
  releaseEventDiscountRedemption: (...args: unknown[]) => releaseEventDiscountRedemption(...args),
}));

describe("deleteEventPayment", () => {
  it("removes storage and deletes the payment row without recreating it", async () => {
    const remove = vi.fn(async () => ({ error: null }));
    const deleteEq = vi.fn(async () => ({ error: null }));
    const insert = vi.fn(async () => ({ error: null }));
    const attendeeFilters: string[] = [];

    const adminClient = {
      from: vi.fn((table: string) => {
        if (table === "event_payments") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({
                  data: {
                    id: "pay-1",
                    status: "pending",
                    amount: 15000,
                    currency: "CLP",
                    gateway_provider: null,
                    receipt_storage_path: "events/e1/a1/receipt.jpg",
                    event_attendee_id: "att-1",
                    event_attendees: {
                      id: "att-1",
                      status: "pending_payment",
                      event_id: "evt-1",
                    },
                  },
                  error: null,
                })),
              })),
            })),
            delete: vi.fn(() => ({ eq: deleteEq })),
            insert,
          };
        }
        if (table === "event_attendees") {
          return {
            delete: vi.fn(() => ({
              eq: vi.fn(async (column: string) => {
                attendeeFilters.push(column);
                return { error: null };
              }),
            })),
          };
        }
        if (table === "event_seat_locks") {
          return { delete: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })) };
        }
        throw new Error(`unexpected table ${table}`);
      }),
      storage: {
        from: vi.fn(() => ({ remove })),
      },
    };

    const result = await deleteEventPayment({
      adminClient: adminClient as never,
      actorId: "admin-1",
      paymentId: "pay-1",
      eventId: "evt-1",
    });

    expect(result).toEqual({ ok: true });
    expect(remove).toHaveBeenCalledWith(["events/e1/a1/receipt.jpg"]);
    expect(deleteEq).toHaveBeenCalledWith("id", "pay-1");
    expect(insert).not.toHaveBeenCalled();
    expect(attendeeFilters).toEqual(["primary_attendee_id", "id"]);
    expect(releaseEventDiscountRedemption).toHaveBeenCalledWith(adminClient, "att-1");
  });

  it("deletes an approved bank transfer and removes the attendees", async () => {
    releaseEventDiscountRedemption.mockClear();
    const attendeeFilters: string[] = [];
    const deleteEq = vi.fn(async () => ({ error: null }));

    const adminClient = {
      from: vi.fn((table: string) => {
        if (table === "event_payments") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({
                  data: {
                    id: "pay-3",
                    status: "approved",
                    amount: 8000,
                    currency: "CLP",
                    gateway_provider: null,
                    receipt_storage_path: null,
                    event_attendee_id: "att-3",
                    event_attendees: {
                      id: "att-3",
                      status: "confirmed",
                      event_id: "evt-1",
                    },
                  },
                  error: null,
                })),
              })),
            })),
            delete: vi.fn(() => ({ eq: deleteEq })),
          };
        }
        if (table === "event_attendees") {
          return {
            delete: vi.fn(() => ({
              eq: vi.fn(async (column: string) => {
                attendeeFilters.push(column);
                return { error: null };
              }),
            })),
          };
        }
        if (table === "event_seat_locks") {
          return { delete: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })) };
        }
        throw new Error(`unexpected table ${table}`);
      }),
      storage: { from: vi.fn(() => ({ remove: vi.fn() })) },
    };

    const result = await deleteEventPayment({
      adminClient: adminClient as never,
      actorId: "admin-1",
      paymentId: "pay-3",
      eventId: "evt-1",
    });

    expect(result).toEqual({ ok: true });
    expect(deleteEq).toHaveBeenCalledWith("id", "pay-3");
    expect(attendeeFilters).toEqual(["primary_attendee_id", "id"]);
    expect(releaseEventDiscountRedemption).toHaveBeenCalledWith(adminClient, "att-3");
  });

  it("refuses approved gateway payments", async () => {
    const adminClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data: {
                id: "pay-2",
                status: "approved",
                amount: 15000,
                currency: "CLP",
                gateway_provider: "mercadopago",
                receipt_storage_path: null,
                event_attendee_id: "att-2",
                event_attendees: {
                  id: "att-2",
                  status: "confirmed",
                  event_id: "evt-1",
                },
              },
              error: null,
            })),
          })),
        })),
      })),
      storage: { from: vi.fn() },
    };

    const result = await deleteEventPayment({
      adminClient: adminClient as never,
      actorId: "admin-1",
      paymentId: "pay-2",
    });

    expect(result).toEqual({ ok: false, code: "not_deletable" });
  });
});
