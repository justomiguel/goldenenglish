/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Dictionary } from "@/types/i18n";

const { sendBrandedEmail } = vi.hoisted(() => ({
  sendBrandedEmail: vi.fn(),
}));

vi.mock("@/lib/email/templates/sendBrandedEmail", () => ({
  sendBrandedEmail,
}));

import { notifyRegistrationScheduleOffer } from "@/lib/register/notifyRegistrationScheduleOffer";

const dict = {
  register: { enrollmentPayCtaOffer: "View the offer" },
} as Dictionary;

const adultLead = {
  first_name: "Ana",
  last_name: "Perez",
  email: "ana@example.com",
  tutor_email: "papa@example.com",
  birth_date: "2000-01-01",
  pay_token: "tok-1",
};

describe("notifyRegistrationScheduleOffer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendBrandedEmail.mockResolvedValue({ ok: true, fromOverride: false });
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://portal.example.com");
  });

  it("sends registration.schedule_offer with the proposed section and offer CTA", async () => {
    await notifyRegistrationScheduleOffer({
      locale: "en",
      dict,
      lead: adultLead,
      originalSectionName: "A2 Mañana",
      proposedSectionName: "A2 Tarde",
      proposedScheduleLabel: "A2 Tarde",
    });
    expect(sendBrandedEmail).toHaveBeenCalledTimes(1);
    expect(sendBrandedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "ana@example.com",
        templateKey: "registration.schedule_offer",
        locale: "en",
        vars: expect.objectContaining({
          studentName: "Ana Perez",
          sectionName: "A2 Mañana",
          scheduleLabel: "A2 Tarde",
          proposedSectionName: "A2 Tarde",
        }),
      }),
    );
    const vars = sendBrandedEmail.mock.calls[0][0].vars as Record<string, string>;
    expect(vars.payBlock).toContain("https://portal.example.com/en/matricula/tok-1");
    expect(vars.payBlock).toContain("View the offer");
  });

  it("returns without sending when there is no pay token or family email", async () => {
    await notifyRegistrationScheduleOffer({
      locale: "en",
      dict,
      lead: { ...adultLead, pay_token: null },
      originalSectionName: "A2 Mañana",
      proposedSectionName: "A2 Tarde",
      proposedScheduleLabel: "A2 Tarde",
    });
    await notifyRegistrationScheduleOffer({
      locale: "en",
      dict,
      lead: {
        ...adultLead,
        email: null,
        tutor_email: null,
        birth_date: "2018-01-01",
      },
      originalSectionName: "A2 Mañana",
      proposedSectionName: "A2 Tarde",
      proposedScheduleLabel: "A2 Tarde",
    });
    expect(sendBrandedEmail).not.toHaveBeenCalled();
  });
});
