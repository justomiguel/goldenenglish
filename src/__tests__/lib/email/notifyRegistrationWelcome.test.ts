/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendBrandedEmail, getPublicSiteUrl } = vi.hoisted(() => ({
  sendBrandedEmail: vi.fn(),
  getPublicSiteUrl: vi.fn(),
}));

vi.mock("@/lib/email/templates/sendBrandedEmail", () => ({
  sendBrandedEmail,
}));
vi.mock("@/lib/site/publicUrl", () => ({
  getPublicSiteUrl,
}));

describe("notifyRegistrationWelcome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendBrandedEmail.mockResolvedValue({ ok: true, fromOverride: false });
    getPublicSiteUrl.mockReturnValue(new URL("https://portal.example.com"));
  });

  it("sends one registration.welcome to the tutor when the student is a minor", async () => {
    const { notifyRegistrationWelcome } = await import("@/lib/email/registrationIntakeEmails");
    await notifyRegistrationWelcome({
      locale: "es",
      isMinor: true,
      studentEmail: "ana@gmail.com",
      tutorEmail: "papa@example.com",
      greetingName: "Luis",
      studentName: "Ana Garcia",
      sectionName: "A2 Mañana",
      scheduleLabel: "Lun y mié 18:00",
    });
    expect(sendBrandedEmail).toHaveBeenCalledTimes(1);
    expect(sendBrandedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "papa@example.com",
        templateKey: "registration.welcome",
        vars: expect.objectContaining({
          studentName: "Ana Garcia",
          inviteUrl: "https://portal.example.com/es/login",
        }),
      }),
    );
  });

  it("sends one registration.welcome to the adult student", async () => {
    const { notifyRegistrationWelcome } = await import("@/lib/email/registrationIntakeEmails");
    await notifyRegistrationWelcome({
      locale: "es",
      isMinor: false,
      studentEmail: "adulto@example.com",
      tutorEmail: "tutor@example.com",
      greetingName: "Luis",
      studentName: "Luis Perez",
      sectionName: "B1",
      scheduleLabel: "B1",
    });
    expect(sendBrandedEmail).toHaveBeenCalledTimes(1);
    expect(sendBrandedEmail.mock.calls[0][0].to).toBe("adulto@example.com");
  });

  it("skips when the family mailbox is synthetic", async () => {
    vi.stubEnv("MAIL_TENANT", "alumnos.test");
    const { notifyRegistrationWelcome } = await import("@/lib/email/registrationIntakeEmails");
    await notifyRegistrationWelcome({
      locale: "es",
      isMinor: true,
      studentEmail: "ana@alumnos.test",
      tutorEmail: "123@parents.alumnos.test",
      greetingName: "Luis",
      studentName: "Ana Garcia",
      sectionName: "A2",
      scheduleLabel: "A2",
    });
    expect(sendBrandedEmail).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
