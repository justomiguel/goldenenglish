import { describe, expect, it, vi } from "vitest";
import { loadEventPaymentsPaginated } from "@/lib/dashboard/events/loadEventPaymentsPaginated";

function queryResult(result: unknown) {
  return {
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => void) => resolve(result),
  };
}

describe("loadEventPaymentsPaginated", () => {
  it("maps payment rows with attendee summary and status counts", async () => {
    const dataQuery = queryResult({
      data: [
        {
          id: "pay-1",
          event_attendee_id: "att-1",
          amount: 15000,
          currency: "CLP",
          status: "pending",
          gateway_provider: null,
          receipt_storage_path: "events/e1/a1/receipt.jpg",
          review_notes: null,
          paid_at: null,
          created_at: "2026-05-01T10:00:00.000Z",
          updated_at: "2026-05-01T10:00:00.000Z",
          event_attendees: {
            id: "att-1",
            first_name: "Ana",
            last_name: "Pérez",
            dni_or_passport: "123",
            email: "ana@example.com",
            phone: "+56911111111",
            status: "pending_payment",
            event_id: "evt-1",
          },
        },
      ],
      error: null,
    });
    const countQuery = queryResult({ count: 1, error: null });
    const pendingQuery = queryResult({ count: 1, error: null });
    const approvedQuery = queryResult({ count: 0, error: null });
    const rejectedQuery = queryResult({ count: 0, error: null });

    const from = vi
      .fn()
      .mockReturnValueOnce({ select: vi.fn(() => dataQuery) })
      .mockReturnValueOnce({ select: vi.fn(() => countQuery) })
      .mockReturnValueOnce({ select: vi.fn(() => pendingQuery) })
      .mockReturnValueOnce({ select: vi.fn(() => approvedQuery) })
      .mockReturnValueOnce({ select: vi.fn(() => rejectedQuery) });

    const result = await loadEventPaymentsPaginated({ from } as never, {
      eventId: "evt-1",
      page: 1,
      pageSize: 25,
    });

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      amount: 15000,
      currency: "CLP",
      status: "pending",
      gatewayProvider: null,
      attendee: {
        firstName: "Ana",
        lastName: "Pérez",
        dniOrPassport: "123",
        email: "ana@example.com",
      },
    });
    expect(result.statusCounts).toEqual({ pending: 1, approved: 0, rejected: 0 });
  });
});
