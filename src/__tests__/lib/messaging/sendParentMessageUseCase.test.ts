/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendParentMessageUseCase } from "@/lib/messaging/useCases/sendParentMessage";
import { MESSAGING_UC_INVALID_RECIPIENT } from "@/lib/messaging/messagingUseCaseCodes";
import { notifyTeacherNewMessage } from "@/lib/messaging/notifyMessagingEmails";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("@/lib/messaging/notifyMessagingEmails", () => ({
  notifyTeacherNewMessage: vi.fn(),
}));

vi.mock("@/lib/messaging/loadParentLinkedTeacherIds", () => ({
  parentCanMessageTeacher: vi.fn(),
}));

import { parentCanMessageTeacher } from "@/lib/messaging/loadParentLinkedTeacherIds";

describe("sendParentMessageUseCase", () => {
  const emailProvider = { sendEmail: vi.fn().mockResolvedValue({ ok: true }) };

  beforeEach(() => {
    vi.mocked(notifyTeacherNewMessage).mockReset();
    vi.mocked(notifyTeacherNewMessage).mockResolvedValue(undefined);
    vi.mocked(parentCanMessageTeacher).mockReset();
  });

  it("returns error when parent cannot message teacher", async () => {
    vi.mocked(parentCanMessageTeacher).mockResolvedValue(false);

    const supabase = {} as unknown as SupabaseClient;

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

  it("returns ok when parent may message teacher", async () => {
    vi.mocked(parentCanMessageTeacher).mockResolvedValue(true);

    const supabase = {
      from: vi.fn(() => ({
        insert: vi.fn().mockResolvedValue({ error: null }),
      })),
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
