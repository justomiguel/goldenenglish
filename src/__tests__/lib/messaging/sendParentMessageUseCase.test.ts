/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendParentMessageUseCase } from "@/lib/messaging/useCases/sendParentMessage";
import { MESSAGING_UC_INVALID_RECIPIENT } from "@/lib/messaging/messagingUseCaseCodes";
import { notifyTeacherNewMessage } from "@/lib/messaging/notifyMessagingEmails";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("@/lib/messaging/notifyMessagingEmails", () => ({
  notifyTeacherNewMessage: vi.fn(),
}));

describe("sendParentMessageUseCase", () => {
  const emailProvider = { sendEmail: vi.fn().mockResolvedValue({ ok: true }) };

  beforeEach(() => {
    vi.mocked(notifyTeacherNewMessage).mockReset();
    vi.mocked(notifyTeacherNewMessage).mockResolvedValue(undefined);
  });

  it("returns error when tutor has no linked students", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "tutor_student_rel") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        throw new Error(`unexpected table ${table}`);
      }),
    } as unknown as SupabaseClient;

    const r = await sendParentMessageUseCase({
      supabase,
      parentId: "p1",
      parentDisplayName: "Pat",
      teacherId: "t1",
      bodyHtml: "<p>x</p>",
      locale: "es",
      emailProvider,
    });
    expect(r).toEqual({ ok: false, message: MESSAGING_UC_INVALID_RECIPIENT });
  });

  it("returns error when no linked student has that assigned teacher", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "tutor_student_rel") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [{ student_id: "s1" }], error: null }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        throw new Error(`unexpected table ${table}`);
      }),
    } as unknown as SupabaseClient;

    const r = await sendParentMessageUseCase({
      supabase,
      parentId: "p1",
      parentDisplayName: "Pat",
      teacherId: "t1",
      bodyHtml: "<p>x</p>",
      locale: "es",
      emailProvider,
    });
    expect(r).toEqual({ ok: false, message: MESSAGING_UC_INVALID_RECIPIENT });
  });

  it("returns ok when a linked student has assigned_teacher_id", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "tutor_student_rel") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [{ student_id: "s1" }], error: null }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [{ id: "s1" }], error: null }),
          };
        }
        if (table === "portal_messages") {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        throw new Error(`unexpected table ${table}`);
      }),
    } as unknown as SupabaseClient;

    const r = await sendParentMessageUseCase({
      supabase,
      parentId: "p1",
      parentDisplayName: "Pat",
      teacherId: "t1",
      bodyHtml: "<p>hi</p>",
      locale: "es",
      emailProvider,
    });
    expect(r).toEqual({ ok: true });
    expect(notifyTeacherNewMessage).toHaveBeenCalled();
  });
});
