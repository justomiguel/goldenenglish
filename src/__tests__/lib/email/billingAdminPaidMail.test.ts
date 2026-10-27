/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { notifyAdminsPaymentPaid, notifyAdminsReceiptPending, collectRecipientEmailsForStudent, sendBrandedEmail } = vi.hoisted(
  () => ({
    notifyAdminsPaymentPaid: vi.fn(async () => undefined),
    notifyAdminsReceiptPending: vi.fn(async () => undefined),
    collectRecipientEmailsForStudent: vi.fn(async () => ["family@example.com"]),
    sendBrandedEmail: vi.fn(async () => ({ ok: true })),
  }),
);

vi.mock("@/lib/email/notifyAdminsPurchasePayment", () => ({
  notifyAdminsPaymentPaid,
}));
vi.mock("@/lib/email/notifyAdminsReceiptPending", () => ({
  notifyAdminsReceiptPending,
}));
vi.mock("@/lib/email/billingEmailRecipients", () => ({
  collectRecipientEmailsForStudent,
}));
vi.mock("@/lib/email/templates/sendBrandedEmail", () => ({
  sendBrandedEmail,
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerException: vi.fn(),
}));

import {
  notifyAdminRecordedPayment,
  notifyMonthlyPaymentDecision,
  notifyPaymentReceiptPending,
} from "@/lib/email/billingPaymentEmails";

const tuition = {
  studentId: "student-1",
  locale: "es" as const,
  month: 3,
  year: 2026,
  amount: 10000,
  currency: "CLP",
};

describe("billing admin paid mail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mails admins only when a monthly payment is approved", async () => {
    await notifyMonthlyPaymentDecision({
      ...tuition,
      decision: "approved",
      adminNotes: null,
    });
    expect(notifyAdminsPaymentPaid).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "tuition", contextLabel: "03/2026", studentId: "student-1" }),
    );

    notifyAdminsPaymentPaid.mockClear();
    await notifyMonthlyPaymentDecision({
      ...tuition,
      decision: "rejected",
      adminNotes: "no",
    });
    expect(notifyAdminsPaymentPaid).not.toHaveBeenCalled();
  });

  it("mails admins when staff record a monthly payment as paid", async () => {
    await notifyAdminRecordedPayment({ ...tuition, sectionName: "A2" });
    expect(notifyAdminsPaymentPaid).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "tuition", contextLabel: "A2 · 03/2026" }),
    );
  });

  it("mails admins when a receipt is waiting for approval", async () => {
    await notifyPaymentReceiptPending({ ...tuition, sectionName: "A2" });
    expect(notifyAdminsPaymentPaid).not.toHaveBeenCalled();
    expect(notifyAdminsReceiptPending).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "tuition",
        contextLabel: "A2 · 03/2026",
        studentId: "student-1",
      }),
    );
  });
});
