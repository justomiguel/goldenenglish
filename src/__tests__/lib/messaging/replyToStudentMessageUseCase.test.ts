/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { replyToStudentMessageUseCase } from "@/lib/messaging/useCases/replyToStudentMessage";
import { notifyStudentTeacherReplied } from "@/lib/messaging/notifyMessagingEmails";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("@/lib/messaging/notifyMessagingEmails", () => ({
  notifyStudentTeacherReplied: vi.fn(),
}));

describe("replyToStudentMessageUseCase", () => {
  const emailProvider = { sendEmail: vi.fn().mockResolvedValue({ ok: true }) };

  beforeEach(() => {
    vi.mocked(notifyStudentTeacherReplied).mockReset();
    vi.mocked(notifyStudentTeacherReplied).mockResolvedValue(undefined);
  });

  function supabaseSuccess() {
    let fromCalls = 0;
    return {
      from: vi.fn(() => {
        fromCalls += 1;
        if (fromCalls === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: "m1", sender_id: "s1", recipient_id: "t1" },
              error: null,
            }),
          };
        }
        if (fromCalls === 2) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: "student" },
              error: null,
            }),
          };
        }
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }),
    } as unknown as SupabaseClient;
  }

  it("returns not found when fetch errors", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: "db" } }),
      })),
    } as unknown as SupabaseClient;
    const r = await replyToStudentMessageUseCase({
      supabase,
      messageId: "m1",
      teacherId: "t1",
      teacherDisplayName: "T",
      replyHtml: "<p>r</p>",
      locale: "es",
      emailProvider,
    });
    expect(r).toEqual({ ok: false, message: "Message not found" });
  });

  it("returns not found when row missing", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    } as unknown as SupabaseClient;
    const r = await replyToStudentMessageUseCase({
      supabase,
      messageId: "m1",
      teacherId: "t1",
      teacherDisplayName: "T",
      replyHtml: "<p>r</p>",
      locale: "es",
      emailProvider,
    });
    expect(r).toEqual({ ok: false, message: "Message not found" });
  });

  it("returns error when sender is not a student", async () => {
    let fromCalls = 0;
    const supabase = {
      from: vi.fn(() => {
        fromCalls += 1;
        if (fromCalls === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: "m1", sender_id: "x1", recipient_id: "t1" },
              error: null,
            }),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { role: "teacher" },
            error: null,
          }),
        };
      }),
    } as unknown as SupabaseClient;
    const r = await replyToStudentMessageUseCase({
      supabase,
      messageId: "m1",
      teacherId: "t1",
      teacherDisplayName: "T",
      replyHtml: "<p>r</p>",
      locale: "es",
      emailProvider,
    });
    expect(r).toEqual({ ok: false, message: "Can only reply to student messages" });
  });

  it("returns ok and notifies on success", async () => {
    const supabase = supabaseSuccess();
    const r = await replyToStudentMessageUseCase({
      supabase,
      messageId: "m1",
      teacherId: "t1",
      teacherDisplayName: "T",
      replyHtml: "<p>r</p>",
      locale: "es",
      emailProvider,
    });
    expect(r).toEqual({ ok: true });
    expect(notifyStudentTeacherReplied).toHaveBeenCalled();
  });

  it("returns ok when notify throws", async () => {
    vi.mocked(notifyStudentTeacherReplied).mockRejectedValue(new Error("mail"));
    const supabase = supabaseSuccess();
    const r = await replyToStudentMessageUseCase({
      supabase,
      messageId: "m1",
      teacherId: "t1",
      teacherDisplayName: "T",
      replyHtml: "<p>r</p>",
      locale: "es",
      emailProvider,
    });
    expect(r).toEqual({ ok: true });
  });

  it("returns error on insert failure", async () => {
    let fromCalls = 0;
    const supabase = {
      from: vi.fn(() => {
        fromCalls += 1;
        if (fromCalls === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: "m1", sender_id: "s1", recipient_id: "t1" },
              error: null,
            }),
          };
        }
        if (fromCalls === 2) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: "student" },
              error: null,
            }),
          };
        }
        return {
          insert: vi.fn().mockResolvedValue({ error: { message: "denied" } }),
        };
      }),
    } as unknown as SupabaseClient;
    const r = await replyToStudentMessageUseCase({
      supabase,
      messageId: "m1",
      teacherId: "t1",
      teacherDisplayName: "T",
      replyHtml: "<p>r</p>",
      locale: "es",
      emailProvider,
    });
    expect(r).toEqual({ ok: false, message: "denied" });
  });
});
