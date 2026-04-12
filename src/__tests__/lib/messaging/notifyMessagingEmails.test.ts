/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";

const getUserById = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    auth: {
      admin: {
        getUserById: (...a: unknown[]) => getUserById(...a),
      },
    },
  })),
}));

vi.mock("@/lib/brand/server", () => ({
  getBrandPublic: vi.fn(() => ({
    name: "Golden English",
  })),
}));

vi.mock("@/lib/site/publicUrl", () => ({
  getPublicSiteUrl: vi.fn(() => new URL("https://example.com")),
}));

describe("notifyMessagingEmails", () => {
  const sendEmail = vi.fn().mockResolvedValue({ ok: true });

  beforeEach(async () => {
    vi.resetModules();
    getUserById.mockReset();
    sendEmail.mockClear();
    getUserById.mockResolvedValue({
      data: { user: { email: "teacher@example.com" } },
      error: null,
    });
  });

  it("notifyTeacherNewMessage sends email when teacher has address", async () => {
    const { notifyTeacherNewMessage } = await import("@/lib/messaging/notifyMessagingEmails");
    await notifyTeacherNewMessage({
      teacherId: "t1",
      studentName: "Ann <script>",
      messagePreview: "Hello",
      locale: "es",
      emailProvider: { sendEmail },
    });
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "teacher@example.com",
        subject: expect.stringContaining("Golden English"),
      }),
    );
    const html = sendEmail.mock.calls[0][0].html as string;
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("notifyTeacherNewMessage skips when no email", async () => {
    getUserById.mockResolvedValue({ data: { user: null }, error: null });
    const { notifyTeacherNewMessage } = await import("@/lib/messaging/notifyMessagingEmails");
    await notifyTeacherNewMessage({
      teacherId: "t1",
      studentName: "A",
      messagePreview: "Hi",
      locale: "en",
      emailProvider: { sendEmail },
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("notifyStudentTeacherReplied sends when student has email", async () => {
    const { notifyStudentTeacherReplied } = await import("@/lib/messaging/notifyMessagingEmails");
    await notifyStudentTeacherReplied({
      studentId: "s1",
      teacherName: "Pat",
      replyPreview: "OK",
      locale: "es",
      emailProvider: { sendEmail },
    });
    expect(sendEmail).toHaveBeenCalled();
  });
});
