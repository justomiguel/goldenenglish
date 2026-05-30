import { describe, expect, it, vi } from "vitest";
import { loadEventAttendeesPaginated } from "@/lib/dashboard/events/loadEventAttendeesPaginated";

function queryResult(result: unknown) {
  return {
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    then: (resolve: (value: unknown) => void) => resolve(result),
  };
}

describe("loadEventAttendeesPaginated", () => {
  it("maps attendee core fields, tutor, and payment summary", async () => {
    const dataQuery = queryResult({
      data: [
        {
          id: "att-1",
          event_id: "evt-1",
          first_name: "Ana",
          last_name: "Pérez",
          dni_or_passport: "123",
          email: "ana@example.com",
          phone: "+56911111111",
          birth_date: "2010-05-01",
          status: "pending_payment",
          source: "public",
          is_local_resident: true,
          user_id: null,
          tutor_id: null,
          tutor_first_name: "María",
          tutor_last_name: "López",
          tutor_dni_or_passport: "456",
          tutor_email: "maria@example.com",
          tutor_phone: "+56922222222",
          tutor_relationship: "mother",
          created_at: "2026-05-01T10:00:00.000Z",
          event_payments: { status: "pending", amount: 15000, currency: "CLP", gateway_provider: null },
        },
      ],
      error: null,
    });
    const countQuery = queryResult({ count: 1, error: null });
    const from = vi
      .fn()
      .mockReturnValueOnce({ select: vi.fn(() => dataQuery) })
      .mockReturnValueOnce({ select: vi.fn(() => countQuery) });

    const result = await loadEventAttendeesPaginated({ from } as never, {
      eventId: "evt-1",
      page: 1,
      pageSize: 25,
    });

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      firstName: "Ana",
      lastName: "Pérez",
      dniOrPassport: "123",
      email: "ana@example.com",
      phone: "+56911111111",
      birthDate: "2010-05-01",
      status: "pending_payment",
      isLocalResident: true,
      payment: { status: "pending", amount: 15000, currency: "CLP", gatewayProvider: null },
      tutor: {
        firstName: "María",
        lastName: "López",
        dniOrPassport: "456",
        email: "maria@example.com",
      },
    });
  });
});
