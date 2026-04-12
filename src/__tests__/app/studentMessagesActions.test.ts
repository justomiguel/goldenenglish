/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  deleteStudentMessage,
  sendStudentMessage,
} from "@/app/[locale]/dashboard/student/messages/actions";
import { replyToStudentMessage as replyTeacherMessage } from "@/app/[locale]/dashboard/teacher/messages/actions";
import { replyToStudentMessageUseCase } from "@/lib/messaging/useCases/replyToStudentMessage";
import { sendStudentMessageUseCase } from "@/lib/messaging/useCases/sendStudentMessage";
import { dictEn } from "@/test/dictEn";
import { MESSAGING_UC_NO_TEACHER } from "@/lib/messaging/messagingUseCaseCodes";
import {
  mockCreateClient,
  supabaseForSendMessage,
  supabaseForStudentMessageDelete,
} from "./studentMessagesActions.shared";

const msg = dictEn.actionErrors.messaging;

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/messaging/useCases/sendStudentMessage", () => ({
  sendStudentMessageUseCase: vi.fn(),
}));
vi.mock("@/lib/messaging/useCases/replyToStudentMessage", () => ({
  replyToStudentMessageUseCase: vi.fn(),
}));
vi.mock("@/lib/email/getEmailProvider", () => ({
  getEmailProvider: vi.fn(() => ({ sendEmail: vi.fn() })),
}));
vi.mock("@/lib/analytics/server/recordUserEvent", () => ({
  recordUserEventServer: vi.fn(() => Promise.resolve({ ok: true })),
}));

describe("sendStudentMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sendStudentMessageUseCase).mockResolvedValue({ ok: true });
  });

  it("rejects empty body after sanitization", async () => {
    const res = await sendStudentMessage("en", "<script></script>");
    expect(res).toEqual({ ok: false, message: msg.emptyMessage });
    expect(sendStudentMessageUseCase).not.toHaveBeenCalled();
  });

  it("returns unauthorized without user", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
      from: vi.fn(),
    });
    const res = await sendStudentMessage("en", "<p>Hi</p>");
    expect(res).toEqual({ ok: false, message: msg.unauthorized });
    expect(sendStudentMessageUseCase).not.toHaveBeenCalled();
  });

  it("returns forbidden for non-student", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseForSendMessage({ userId: "u1", role: "teacher" }),
    );
    const res = await sendStudentMessage("en", "<p>Hi</p>");
    expect(res).toEqual({ ok: false, message: msg.forbidden });
    expect(sendStudentMessageUseCase).not.toHaveBeenCalled();
  });

  it("passes sanitized HTML to use case", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseForSendMessage({ userId: "u1", role: "student" }),
    );
    await sendStudentMessage("en", "<p>x</p><script>bad()</script>");
    expect(sendStudentMessageUseCase).toHaveBeenCalledWith(
      expect.objectContaining({
        bodyHtml: expect.not.stringMatching(/script/i),
      }),
    );
  });

  it("maps use case failure codes to localized copy", async () => {
    vi.mocked(sendStudentMessageUseCase).mockResolvedValue({
      ok: false,
      message: MESSAGING_UC_NO_TEACHER,
    });
    mockCreateClient.mockResolvedValue(
      supabaseForSendMessage({ userId: "u1", role: "student" }),
    );
    const res = await sendStudentMessage("en", "<p>Hi</p>");
    expect(res).toEqual({ ok: false, message: msg.noTeacherForStudent });
  });
});

describe("deleteStudentMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid uuid", async () => {
    const res = await deleteStudentMessage("en", "not-a-uuid");
    expect(res).toEqual({ ok: false, message: msg.invalidId });
  });

  it("deletes when student is authorized", async () => {
    mockCreateClient.mockResolvedValue(supabaseForStudentMessageDelete({ userId: "u1" }));
    const res = await deleteStudentMessage("en", "550e8400-e29b-41d4-a716-446655440000");
    expect(res).toEqual({ ok: true });
  });

  it("returns localized persist error when delete fails", async () => {
    mockCreateClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { role: "student" }, error: null }),
          };
        }
        if (table === "portal_messages") {
          const end = vi.fn().mockResolvedValue({ error: { message: "rls" } });
          const mid = vi.fn().mockReturnValue({ eq: end });
          return { delete: vi.fn().mockReturnValue({ eq: mid }) };
        }
        throw new Error(`unexpected ${table}`);
      }),
    });
    const res = await deleteStudentMessage("en", "550e8400-e29b-41d4-a716-446655440000");
    expect(res).toEqual({ ok: false, message: msg.persistFailed });
  });
});

describe("replyToStudentMessage (teacher)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(replyToStudentMessageUseCase).mockResolvedValue({ ok: true });
  });

  it("rejects empty reply after sanitization", async () => {
    const res = await replyTeacherMessage("en", "550e8400-e29b-41d4-a716-446655440000", "<script></script>");
    expect(res).toEqual({ ok: false, message: msg.emptyReply });
    expect(replyToStudentMessageUseCase).not.toHaveBeenCalled();
  });

  it("passes sanitized reply to use case", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseForSendMessage({ userId: "t1", role: "teacher" }),
    );
    await replyTeacherMessage(
      "en",
      "550e8400-e29b-41d4-a716-446655440000",
      '<p>ok</p><img src=x onerror="alert(1)">',
    );
    expect(replyToStudentMessageUseCase).toHaveBeenCalledWith(
      expect.objectContaining({
        replyHtml: expect.not.stringMatching(/onerror/i),
      }),
    );
  });
});
