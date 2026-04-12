import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendStaffMessageUseCase } from "@/lib/messaging/useCases/sendStaffMessage";
import {
  notifyPortalInboxForStudentOrParent,
  notifyPortalRecipientForStaffMessage,
} from "@/lib/messaging/notifyMessagingEmails";
import { MESSAGING_UC_PERSIST_FAILED } from "@/lib/messaging/messagingUseCaseCodes";

vi.mock("@/lib/messaging/notifyMessagingEmails", () => ({
  notifyPortalInboxForStudentOrParent: vi.fn(),
  notifyPortalRecipientForStaffMessage: vi.fn(),
}));

function buildSupabase(opts: {
  insertError?: { message: string } | null;
  recipientRole?: string | null;
}) {
  const insert = vi.fn().mockResolvedValue(
    opts.insertError ? { error: opts.insertError } : { error: null },
  );
  const maybeSingle = vi.fn().mockResolvedValue({
    data: opts.recipientRole != null ? { role: opts.recipientRole } : null,
  });
  const from = vi.fn((table: string) => {
    if (table === "portal_messages") return { insert };
    if (table === "profiles") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ maybeSingle }),
        }),
      };
    }
    throw new Error(`unexpected table ${table}`);
  });
  return { from, insert, maybeSingle } as unknown as SupabaseClient;
}

const baseInput = {
  senderId: "s1",
  senderDisplayName: "Staff",
  recipientId: "r1",
  bodyHtml: "<p>Hi</p>",
  locale: "en",
  emailProvider: { sendEmail: vi.fn() },
};

describe("sendStaffMessageUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns failure when insert fails", async () => {
    const supabase = buildSupabase({ insertError: { message: "db" } });
    const r = await sendStaffMessageUseCase({ ...baseInput, supabase });
    expect(r).toEqual({ ok: false, message: MESSAGING_UC_PERSIST_FAILED });
    expect(notifyPortalRecipientForStaffMessage).not.toHaveBeenCalled();
  });

  it("notifies staff recipient for teacher role", async () => {
    const supabase = buildSupabase({ recipientRole: "teacher" });
    const r = await sendStaffMessageUseCase({ ...baseInput, supabase });
    expect(r).toEqual({ ok: true });
    expect(notifyPortalRecipientForStaffMessage).toHaveBeenCalled();
    expect(notifyPortalInboxForStudentOrParent).not.toHaveBeenCalled();
  });

  it("notifies staff recipient for admin role", async () => {
    const supabase = buildSupabase({ recipientRole: "admin" });
    const r = await sendStaffMessageUseCase({ ...baseInput, supabase });
    expect(r).toEqual({ ok: true });
    expect(notifyPortalRecipientForStaffMessage).toHaveBeenCalled();
  });

  it("notifies inbox for student role", async () => {
    const supabase = buildSupabase({ recipientRole: "student" });
    const r = await sendStaffMessageUseCase({ ...baseInput, supabase });
    expect(r).toEqual({ ok: true });
    expect(notifyPortalInboxForStudentOrParent).toHaveBeenCalled();
  });

  it("notifies inbox for parent role", async () => {
    const supabase = buildSupabase({ recipientRole: "parent" });
    const r = await sendStaffMessageUseCase({ ...baseInput, supabase });
    expect(r).toEqual({ ok: true });
    expect(notifyPortalInboxForStudentOrParent).toHaveBeenCalled();
  });

  it("still returns ok when notify throws", async () => {
    vi.mocked(notifyPortalRecipientForStaffMessage).mockRejectedValueOnce(new Error("mail down"));
    const supabase = buildSupabase({ recipientRole: "teacher" });
    const r = await sendStaffMessageUseCase({ ...baseInput, supabase });
    expect(r).toEqual({ ok: true });
  });
});
