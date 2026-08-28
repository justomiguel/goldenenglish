/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendBrandedEmail, collectFamilyMailboxesForStudent, getPublicSiteUrl } = vi.hoisted(
  () => ({
    sendBrandedEmail: vi.fn(),
    collectFamilyMailboxesForStudent: vi.fn(),
    getPublicSiteUrl: vi.fn(),
  }),
);

vi.mock("@/lib/email/templates/sendBrandedEmail", () => ({
  sendBrandedEmail,
}));
vi.mock("@/lib/email/collectFamilyMailboxesForStudent", () => ({
  collectFamilyMailboxesForStudent,
}));
vi.mock("@/lib/site/publicUrl", () => ({
  getPublicSiteUrl,
}));

describe("notifyAdminCreatedStudentWelcome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendBrandedEmail.mockResolvedValue({ ok: true, fromOverride: false });
    getPublicSiteUrl.mockReturnValue(new URL("https://portal.example.com"));
  });

  it("sends the tutor welcome and never emails a minor student", async () => {
    collectFamilyMailboxesForStudent.mockResolvedValue({
      isMinor: true,
      studentEmail: "ana@gmail.com",
      tutorEmails: ["papa@example.com"],
    });
    const { notifyAdminCreatedStudentWelcome } = await import(
      "@/lib/email/notifyAdminCreatedStudentWelcome"
    );
    await notifyAdminCreatedStudentWelcome({
      studentId: "stu-1",
      locale: "es",
      studentFirstName: "Ana",
      studentLastName: "Garcia",
    });
    expect(sendBrandedEmail).toHaveBeenCalledTimes(1);
    expect(sendBrandedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "papa@example.com",
        templateKey: "notifications.admin_tutor_welcome",
        vars: expect.objectContaining({
          studentName: "Ana Garcia",
          portalUrl: "https://portal.example.com/es/login",
        }),
      }),
    );
    expect(sendBrandedEmail.mock.calls[0][0].to).not.toBe("ana@gmail.com");
  });

  it("sends the student welcome when the adult has a real mailbox", async () => {
    collectFamilyMailboxesForStudent.mockResolvedValue({
      isMinor: false,
      studentEmail: "adulto@example.com",
      tutorEmails: ["tutor@example.com"],
    });
    const { notifyAdminCreatedStudentWelcome } = await import(
      "@/lib/email/notifyAdminCreatedStudentWelcome"
    );
    await notifyAdminCreatedStudentWelcome({
      studentId: "stu-2",
      locale: "es",
      studentFirstName: "Luis",
      studentLastName: "Perez",
    });
    expect(sendBrandedEmail).toHaveBeenCalledTimes(1);
    expect(sendBrandedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "adulto@example.com",
        templateKey: "notifications.admin_student_welcome",
      }),
    );
  });

  it("does not send when nobody has a deliverable mailbox", async () => {
    collectFamilyMailboxesForStudent.mockResolvedValue({
      isMinor: true,
      studentEmail: "kid@alumnos.test",
      tutorEmails: ["123@parents.alumnos.test"],
    });
    const { notifyAdminCreatedStudentWelcome } = await import(
      "@/lib/email/notifyAdminCreatedStudentWelcome"
    );
    await notifyAdminCreatedStudentWelcome({
      studentId: "stu-3",
      locale: "es",
      studentFirstName: "Ana",
      studentLastName: "Garcia",
    });
    expect(sendBrandedEmail).not.toHaveBeenCalled();
  });

  it("honors isMinor so a child is never invited even if collect says adult", async () => {
    collectFamilyMailboxesForStudent.mockResolvedValue({
      isMinor: false,
      studentEmail: "ana@gmail.com",
      tutorEmails: ["papa@example.com"],
    });
    const { notifyAdminCreatedStudentWelcome } = await import(
      "@/lib/email/notifyAdminCreatedStudentWelcome"
    );
    await notifyAdminCreatedStudentWelcome({
      studentId: "stu-minor",
      locale: "es",
      studentFirstName: "Ana",
      studentLastName: "Garcia",
      isMinor: true,
    });
    expect(sendBrandedEmail).toHaveBeenCalledTimes(1);
    expect(sendBrandedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "papa@example.com",
        templateKey: "notifications.admin_tutor_welcome",
      }),
    );
  });

  it("never puts a password in the email vars", async () => {
    collectFamilyMailboxesForStudent.mockResolvedValue({
      isMinor: false,
      studentEmail: "adulto@example.com",
      tutorEmails: [],
    });
    const { notifyAdminCreatedStudentWelcome } = await import(
      "@/lib/email/notifyAdminCreatedStudentWelcome"
    );
    await notifyAdminCreatedStudentWelcome({
      studentId: "stu-4",
      locale: "es",
      studentFirstName: "Luis",
      studentLastName: "Perez",
    });
    const vars = sendBrandedEmail.mock.calls[0][0].vars as Record<string, string>;
    expect(JSON.stringify(vars).toLowerCase()).not.toMatch(/password|contrase/);
  });
});
