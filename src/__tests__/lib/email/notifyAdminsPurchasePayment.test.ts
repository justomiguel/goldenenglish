/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendRegistrationAdminEmails, createAdminClient, logServerException } = vi.hoisted(() => ({
  sendRegistrationAdminEmails: vi.fn(),
  createAdminClient: vi.fn(),
  logServerException: vi.fn(),
}));

vi.mock("@/lib/email/registrationIntakeEmails", () => ({
  sendRegistrationAdminEmails,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient,
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerException,
  logSupabaseClientError: vi.fn(),
}));

import {
  notifyAdminsEventPaymentPaid,
  notifyAdminsEventRegistered,
  notifyAdminsPaymentPaid,
} from "@/lib/email/notifyAdminsPurchasePayment";

describe("notifyAdminsPurchasePayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendRegistrationAdminEmails.mockResolvedValue(undefined);
  });

  it("mails each admin once with the event, buyer, seats, amount, and pending state", async () => {
    createAdminClient.mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { title: "Concierto", currency: "CLP" }, error: null }),
          }),
        }),
      }),
    });

    await notifyAdminsEventRegistered({
      eventId: "event-1",
      firstName: "Ana",
      lastName: "Pérez",
      seatCount: 2,
      amount: 20000,
      currency: "CLP",
      paymentPending: true,
      locale: "es",
    });

    expect(sendRegistrationAdminEmails).toHaveBeenCalledTimes(1);
    expect(sendRegistrationAdminEmails).toHaveBeenCalledWith({
      locale: "es",
      templateKey: "events.admin_registered",
      vars: {
        eventTitle: "Concierto",
        buyerName: "Pérez Ana",
        seatCount: "2",
        amountLabel: expect.stringContaining("20"),
        paymentState: "El pago sigue pendiente.",
      },
    });
  });

  it("still resolves when the admin send throws", async () => {
    createAdminClient.mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { title: "Show", currency: "CLP" }, error: null }),
          }),
        }),
      }),
    });
    sendRegistrationAdminEmails.mockRejectedValue(new Error("smtp down"));

    await expect(
      notifyAdminsEventRegistered({
        eventId: "event-1",
        firstName: "Ana",
        lastName: "Pérez",
        seatCount: 1,
        amount: 0,
        currency: "CLP",
        paymentPending: false,
        locale: "en",
      }),
    ).resolves.toBeUndefined();
    expect(logServerException).toHaveBeenCalled();
  });

  it("sends the paid mail for a tuition student and skips a rejected decision path", async () => {
    createAdminClient.mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { first_name: "Ana", last_name: "Pérez" },
              error: null,
            }),
          }),
        }),
      }),
    });

    await notifyAdminsPaymentPaid({
      locale: "en",
      kind: "tuition",
      contextLabel: "03/2026",
      studentId: "student-1",
      amount: 100,
      currency: "USD",
    });

    expect(sendRegistrationAdminEmails).toHaveBeenCalledWith(
      expect.objectContaining({
        templateKey: "payments.admin_paid",
        locale: "en",
        vars: expect.objectContaining({
          paymentKind: "Monthly tuition",
          contextLabel: "03/2026",
          payerName: "Pérez Ana",
        }),
      }),
    );
  });

  it("loads the event payment once and does not throw when the row is missing", async () => {
    createAdminClient.mockResolvedValue({
      from: (table: string) => {
        if (table === "event_payments") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    amount: 15000,
                    currency: "CLP",
                    event_attendee_id: "att-1",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "event_attendees") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    first_name: "Ana",
                    last_name: "Pérez",
                    registration_locale: "es",
                    event_id: "event-1",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { title: "Concierto", currency: "CLP" }, error: null }),
            }),
          }),
        };
      },
    });

    await notifyAdminsEventPaymentPaid("pay-1");
    expect(sendRegistrationAdminEmails).toHaveBeenCalledWith(
      expect.objectContaining({
        templateKey: "payments.admin_paid",
        vars: expect.objectContaining({
          paymentKind: "Evento",
          contextLabel: "Concierto",
          payerName: "Pérez Ana",
        }),
      }),
    );

    sendRegistrationAdminEmails.mockClear();
    createAdminClient.mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    });
    await expect(notifyAdminsEventPaymentPaid("missing")).resolves.toBeUndefined();
    expect(sendRegistrationAdminEmails).not.toHaveBeenCalled();
  });
});
