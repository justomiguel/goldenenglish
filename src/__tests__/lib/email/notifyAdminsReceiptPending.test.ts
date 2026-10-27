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
  notifyAdminsEventReceiptPending,
  notifyAdminsReceiptPending,
} from "@/lib/email/notifyAdminsReceiptPending";

function adminFrom(rows: Record<string, unknown>) {
  return {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: rows[table] ?? null, error: null }),
        }),
      }),
    }),
  };
}

describe("notifyAdminsReceiptPending", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendRegistrationAdminEmails.mockResolvedValue(undefined);
  });

  it("tells admins a tuition receipt is waiting for approval", async () => {
    createAdminClient.mockResolvedValue(
      adminFrom({ profiles: { first_name: "Ana", last_name: "Pérez" } }),
    );

    await notifyAdminsReceiptPending({
      locale: "es",
      kind: "tuition",
      contextLabel: "A2 · 03/2026",
      studentId: "student-1",
      amount: 10000,
      currency: "CLP",
    });

    expect(sendRegistrationAdminEmails).toHaveBeenCalledWith({
      locale: "es",
      templateKey: "payments.admin_receipt_pending",
      vars: expect.objectContaining({
        paymentKind: "Mensualidad",
        contextLabel: "A2 · 03/2026",
        payerName: "Pérez Ana",
        amountLabel: expect.stringContaining("10"),
      }),
    });
  });

  it("tells admins an invoice receipt is waiting, even without a currency", async () => {
    createAdminClient.mockResolvedValue(
      adminFrom({ profiles: { first_name: "Ana", last_name: "Pérez" } }),
    );

    await notifyAdminsReceiptPending({
      locale: "es",
      kind: "invoice",
      contextLabel: "Cuota marzo",
      studentId: "student-1",
      amount: 45000,
      currency: null,
    });

    expect(sendRegistrationAdminEmails).toHaveBeenCalledWith({
      locale: "es",
      templateKey: "payments.admin_receipt_pending",
      vars: expect.objectContaining({
        paymentKind: "Factura",
        contextLabel: "Cuota marzo",
        payerName: "Pérez Ana",
        amountLabel: "45000",
      }),
    });
  });

  it("mails once for an event receipt and skips a missing attendee", async () => {
    createAdminClient.mockResolvedValue(
      adminFrom({
        event_attendees: {
          first_name: "Ana",
          last_name: "Pérez",
          registration_locale: "en",
          event_id: "event-1",
        },
        events: { title: "Concert" },
        event_payments: { amount: 15000, currency: "CLP" },
      }),
    );

    await notifyAdminsEventReceiptPending("att-1");
    expect(sendRegistrationAdminEmails).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: "en",
        templateKey: "payments.admin_receipt_pending",
        vars: expect.objectContaining({
          paymentKind: "Event",
          contextLabel: "Concert",
          payerName: "Pérez Ana",
        }),
      }),
    );

    sendRegistrationAdminEmails.mockClear();
    createAdminClient.mockResolvedValue(adminFrom({}));
    await expect(notifyAdminsEventReceiptPending("missing")).resolves.toBeUndefined();
    expect(sendRegistrationAdminEmails).not.toHaveBeenCalled();
  });

  it("still resolves when the admin send throws", async () => {
    sendRegistrationAdminEmails.mockRejectedValue(new Error("smtp down"));
    await expect(
      notifyAdminsReceiptPending({
        locale: "es",
        kind: "event",
        contextLabel: "Show",
        payerName: "Pérez Ana",
        amount: 1,
        currency: "CLP",
      }),
    ).resolves.toBeUndefined();
    expect(logServerException).toHaveBeenCalled();
  });
});
