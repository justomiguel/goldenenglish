/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { collectRecipientEmailsForStudent, sendBrandedEmail } = vi.hoisted(() => ({
  collectRecipientEmailsForStudent: vi.fn(),
  sendBrandedEmail: vi.fn(),
}));

vi.mock("@/lib/email/billingEmailRecipients", () => ({
  collectRecipientEmailsForStudent,
}));
vi.mock("@/lib/email/templates/sendBrandedEmail", () => ({
  sendBrandedEmail,
}));

describe("notifyOverdueBalance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    collectRecipientEmailsForStudent.mockResolvedValue(["a@x.test"]);
  });

  it("returns disabled when sendBrandedEmail skips", async () => {
    sendBrandedEmail.mockResolvedValue({ ok: true, skipped: true });
    const { notifyOverdueBalance } = await import("@/lib/email/billingPaymentEmails");
    await expect(
      notifyOverdueBalance({
        studentId: "00000000-0000-4000-8000-000000000001",
        locale: "es",
        sectionName: "A",
        amount: 10,
        currency: "USD",
        year: 2026,
      }),
    ).resolves.toEqual({ outcome: "disabled" });
  });

  it("returns ok when the email is delivered", async () => {
    sendBrandedEmail.mockResolvedValue({ ok: true, fromOverride: false });
    const { notifyOverdueBalance } = await import("@/lib/email/billingPaymentEmails");
    await expect(
      notifyOverdueBalance({
        studentId: "00000000-0000-4000-8000-000000000001",
        locale: "es",
        sectionName: "A",
        amount: 10,
        currency: "USD",
        year: 2026,
      }),
    ).resolves.toEqual({ outcome: "ok" });
  });
});
