/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendParentReplyUseCase } from "@/lib/messaging/useCases/sendParentReply";
import {
  MESSAGING_UC_REPLY_INVALID_SENDER,
  MESSAGING_UC_REPLY_NOT_FOUND,
} from "@/lib/messaging/messagingUseCaseCodes";
import {
  notifyPortalRecipientForStaffMessage,
  notifyTeacherNewMessage,
} from "@/lib/messaging/notifyMessagingEmails";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/messaging/notifyMessagingEmails", () => ({
  notifyPortalRecipientForStaffMessage: vi.fn(),
  notifyTeacherNewMessage: vi.fn(),
}));

// REGRESSION CHECK: A parent reply goes to one prior sender. It does not require a linked student and it does not fan out to every admin.

function sessionClient(opts: { prior: boolean; insertError?: { message: string } | null }) {
  return {
    from: vi.fn((table: string) => {
      if (table !== "portal_messages") throw new Error(table);
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: opts.prior ? [{ id: "prior-1" }] : [],
                error: null,
              }),
            }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ error: opts.insertError ?? null }),
      };
    }),
  } as unknown as SupabaseClient;
}

describe("sendParentReplyUseCase", () => {
  const emailProvider = { sendEmail: vi.fn().mockResolvedValue({ ok: true }) };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(notifyPortalRecipientForStaffMessage).mockResolvedValue(undefined);
    vi.mocked(notifyTeacherNewMessage).mockResolvedValue(undefined);
  });

  it("rejects when that person never wrote to the parent", async () => {
    const r = await sendParentReplyUseCase({
      supabase: sessionClient({ prior: false }),
      parentId: "p1",
      parentDisplayName: "Rojas Ana",
      recipientId: "a1",
      bodyHtml: "<p>ok</p>",
      locale: "es",
      emailProvider,
    });
    expect(r).toEqual({ ok: false, message: MESSAGING_UC_REPLY_NOT_FOUND });
  });

  it("rejects when the sender is not an admin or a teacher", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { role: "student" }, error: null }),
          }),
        }),
      })),
    } as never);

    const r = await sendParentReplyUseCase({
      supabase: sessionClient({ prior: true }),
      parentId: "p1",
      parentDisplayName: "Rojas Ana",
      recipientId: "s1",
      bodyHtml: "<p>ok</p>",
      locale: "es",
      emailProvider,
    });
    expect(r).toEqual({ ok: false, message: MESSAGING_UC_REPLY_INVALID_SENDER });
  });

  it("inserts one row to the admin who wrote first", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [{ id: "prior-1" }], error: null }),
            }),
          }),
        }),
        insert,
      })),
    } as unknown as SupabaseClient;

    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { role: "admin" }, error: null }),
          }),
        }),
      })),
    } as never);

    const r = await sendParentReplyUseCase({
      supabase,
      parentId: "p1",
      parentDisplayName: "Rojas Ana",
      recipientId: "a1",
      bodyHtml: "<p>thanks</p>",
      locale: "es",
      emailProvider,
    });

    expect(r).toEqual({ ok: true, recipientRole: "admin" });
    expect(insert).toHaveBeenCalledWith({
      sender_id: "p1",
      recipient_id: "a1",
      body_html: "<p>thanks</p>",
    });
    expect(notifyPortalRecipientForStaffMessage).toHaveBeenCalledOnce();
    expect(notifyTeacherNewMessage).not.toHaveBeenCalled();
  });

  it("notifies the teacher when the sender is a teacher", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { role: "teacher" }, error: null }),
          }),
        }),
      })),
    } as never);

    const r = await sendParentReplyUseCase({
      supabase: sessionClient({ prior: true }),
      parentId: "p1",
      parentDisplayName: "Rojas Ana",
      recipientId: "t1",
      bodyHtml: "<p>ok</p>",
      locale: "es",
      emailProvider,
    });
    expect(r).toEqual({ ok: true, recipientRole: "teacher" });
    expect(notifyTeacherNewMessage).toHaveBeenCalledOnce();
  });
});
