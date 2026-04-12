/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendStudentMessageUseCase } from "@/lib/messaging/useCases/sendStudentMessage";
import { resolveTeacherIdForStudent } from "@/lib/messaging/resolveTeacherId";
import { notifyTeacherNewMessage } from "@/lib/messaging/notifyMessagingEmails";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("@/lib/messaging/resolveTeacherId", () => ({
  resolveTeacherIdForStudent: vi.fn(),
}));

vi.mock("@/lib/messaging/notifyMessagingEmails", () => ({
  notifyTeacherNewMessage: vi.fn(),
}));

describe("sendStudentMessageUseCase", () => {
  const emailProvider = { sendEmail: vi.fn().mockResolvedValue({ ok: true }) };

  beforeEach(() => {
    vi.mocked(resolveTeacherIdForStudent).mockReset();
    vi.mocked(notifyTeacherNewMessage).mockReset();
    vi.mocked(notifyTeacherNewMessage).mockResolvedValue(undefined);
  });

  it("returns error when no teacher", async () => {
    vi.mocked(resolveTeacherIdForStudent).mockResolvedValue(null);
    const supabase = { from: vi.fn() } as unknown as SupabaseClient;
    const r = await sendStudentMessageUseCase({
      supabase,
      studentId: "s1",
      studentDisplayName: "A B",
      bodyHtml: "<p>x</p>",
      locale: "es",
      emailProvider,
    });
    expect(r).toEqual({ ok: false, message: "No teacher available" });
  });

  it("returns error on insert failure", async () => {
    vi.mocked(resolveTeacherIdForStudent).mockResolvedValue("t1");
    const supabase = {
      from: vi.fn(() => ({
        insert: vi.fn().mockResolvedValue({ error: { message: "rls" } }),
      })),
    } as unknown as SupabaseClient;
    const r = await sendStudentMessageUseCase({
      supabase,
      studentId: "s1",
      studentDisplayName: "A",
      bodyHtml: "<p>x</p>",
      locale: "es",
      emailProvider,
    });
    expect(r).toEqual({ ok: false, message: "rls" });
  });

  it("returns ok and notifies on success", async () => {
    vi.mocked(resolveTeacherIdForStudent).mockResolvedValue("t1");
    const supabase = {
      from: vi.fn(() => ({
        insert: vi.fn().mockResolvedValue({ error: null }),
      })),
    } as unknown as SupabaseClient;
    const r = await sendStudentMessageUseCase({
      supabase,
      studentId: "s1",
      studentDisplayName: "A",
      bodyHtml: "<p>hi</p>",
      locale: "es",
      emailProvider,
    });
    expect(r).toEqual({ ok: true });
    expect(notifyTeacherNewMessage).toHaveBeenCalled();
  });

  it("returns ok when notify throws (email best-effort)", async () => {
    vi.mocked(resolveTeacherIdForStudent).mockResolvedValue("t1");
    vi.mocked(notifyTeacherNewMessage).mockRejectedValue(new Error("smtp"));
    const supabase = {
      from: vi.fn(() => ({
        insert: vi.fn().mockResolvedValue({ error: null }),
      })),
    } as unknown as SupabaseClient;
    const r = await sendStudentMessageUseCase({
      supabase,
      studentId: "s1",
      studentDisplayName: "A",
      bodyHtml: "<p>hi</p>",
      locale: "es",
      emailProvider,
    });
    expect(r).toEqual({ ok: true });
  });
});
