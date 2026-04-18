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
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    }),
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
      senderName: "Ann <script>",
      messagePreview: "Hello",
      locale: "es",
      emailProvider: { sendEmail },
    });
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "teacher@example.com",
        subject: expect.any(String),
      }),
    );
    const html = sendEmail.mock.calls[0][0].html as string;
    expect(html).toContain("Golden English");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("notifyTeacherNewMessage skips when no email", async () => {
    getUserById.mockResolvedValue({ data: { user: null }, error: null });
    const { notifyTeacherNewMessage } = await import("@/lib/messaging/notifyMessagingEmails");
    await notifyTeacherNewMessage({
      teacherId: "t1",
      senderName: "A",
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

  it("notifyPortalRecipientForStaffMessage routes admin recipients to /dashboard/admin/messages", async () => {
    const { notifyPortalRecipientForStaffMessage } = await import(
      "@/lib/messaging/notifyMessagingEmails"
    );
    await notifyPortalRecipientForStaffMessage({
      recipientId: "u1",
      senderName: "Sender",
      messagePreview: "preview",
      locale: "en",
      emailProvider: { sendEmail },
      recipientRole: "admin",
    });
    expect(sendEmail).toHaveBeenCalled();
    const html = sendEmail.mock.calls[0][0].html as string;
    expect(html).toContain("/en/dashboard/admin/messages");
  });

  it("notifyPortalRecipientForStaffMessage routes teacher and assistant recipients to /dashboard/teacher/messages", async () => {
    const { notifyPortalRecipientForStaffMessage } = await import(
      "@/lib/messaging/notifyMessagingEmails"
    );
    await notifyPortalRecipientForStaffMessage({
      recipientId: "u2",
      senderName: "Sender",
      messagePreview: "preview",
      locale: "es",
      emailProvider: { sendEmail },
      recipientRole: "teacher",
    });
    await notifyPortalRecipientForStaffMessage({
      recipientId: "u3",
      senderName: "Sender",
      messagePreview: "preview",
      locale: "es",
      emailProvider: { sendEmail },
      recipientRole: "assistant",
    });
    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(sendEmail.mock.calls[0][0].html as string).toContain(
      "/es/dashboard/teacher/messages",
    );
    expect(sendEmail.mock.calls[1][0].html as string).toContain(
      "/es/dashboard/teacher/messages",
    );
  });

  it("notifyPortalRecipientForStaffMessage no-ops when recipient has no email", async () => {
    getUserById.mockResolvedValue({ data: { user: null }, error: null });
    const { notifyPortalRecipientForStaffMessage } = await import(
      "@/lib/messaging/notifyMessagingEmails"
    );
    await notifyPortalRecipientForStaffMessage({
      recipientId: "u1",
      senderName: "Sender",
      messagePreview: "x",
      locale: "en",
      emailProvider: { sendEmail },
      recipientRole: "admin",
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("notifyPortalInboxForStudentOrParent routes parent and student recipients to their inbox", async () => {
    const { notifyPortalInboxForStudentOrParent } = await import(
      "@/lib/messaging/notifyMessagingEmails"
    );
    await notifyPortalInboxForStudentOrParent({
      recipientId: "p1",
      senderName: "Sender",
      messagePreview: "preview",
      locale: "es",
      emailProvider: { sendEmail },
      recipientRole: "parent",
    });
    await notifyPortalInboxForStudentOrParent({
      recipientId: "s1",
      senderName: "Sender",
      messagePreview: "preview",
      locale: "es",
      emailProvider: { sendEmail },
      recipientRole: "student",
    });
    expect(sendEmail).toHaveBeenCalledTimes(2);
    expect(sendEmail.mock.calls[0][0].html as string).toContain(
      "/es/dashboard/parent/messages",
    );
    expect(sendEmail.mock.calls[1][0].html as string).toContain(
      "/es/dashboard/student/messages",
    );
  });

  it("notifyPortalInboxForStudentOrParent no-ops when recipient has no email", async () => {
    getUserById.mockResolvedValue({ data: { user: null }, error: null });
    const { notifyPortalInboxForStudentOrParent } = await import(
      "@/lib/messaging/notifyMessagingEmails"
    );
    await notifyPortalInboxForStudentOrParent({
      recipientId: "p1",
      senderName: "Sender",
      messagePreview: "x",
      locale: "en",
      emailProvider: { sendEmail },
      recipientRole: "parent",
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("notifyStudentTeacherReplied no-ops when student has no email", async () => {
    getUserById.mockResolvedValue({ data: { user: null }, error: null });
    const { notifyStudentTeacherReplied } = await import(
      "@/lib/messaging/notifyMessagingEmails"
    );
    await notifyStudentTeacherReplied({
      studentId: "s1",
      teacherName: "Pat",
      replyPreview: "x",
      locale: "es",
      emailProvider: { sendEmail },
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("notifyParentTeacherReplied sends to parent inbox link", async () => {
    const { notifyParentTeacherReplied } = await import(
      "@/lib/messaging/notifyMessagingEmails"
    );
    await notifyParentTeacherReplied({
      parentId: "p1",
      teacherName: "Pat<>",
      replyPreview: "OK",
      locale: "en",
      emailProvider: { sendEmail },
    });
    expect(sendEmail).toHaveBeenCalled();
    const html = sendEmail.mock.calls[0][0].html as string;
    expect(html).toContain("/en/dashboard/parent/messages");
    expect(html).toContain("Pat&lt;&gt;");
  });

  it("notifyParentTeacherReplied no-ops when parent has no email", async () => {
    getUserById.mockResolvedValue({ data: { user: null }, error: null });
    const { notifyParentTeacherReplied } = await import(
      "@/lib/messaging/notifyMessagingEmails"
    );
    await notifyParentTeacherReplied({
      parentId: "p1",
      teacherName: "Pat",
      replyPreview: "x",
      locale: "es",
      emailProvider: { sendEmail },
    });
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
