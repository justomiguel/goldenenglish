/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendParentReply } from "@/app/[locale]/dashboard/parent/messages/actions";
import { sendParentReplyUseCase } from "@/lib/messaging/useCases/sendParentReply";
import { dictEn } from "@/test/dictEn";

const msg = dictEn.actionErrors.messaging;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/messaging/useCases/sendParentReply", () => ({
  sendParentReplyUseCase: vi.fn(),
}));
vi.mock("@/lib/email/getEmailProvider", () => ({
  getEmailProvider: vi.fn(() => ({ sendEmail: vi.fn() })),
}));
vi.mock("@/lib/analytics/server/recordUserEvent", () => ({
  recordUserEventServer: vi.fn(() => Promise.resolve({ ok: true })),
}));

function parentSession() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "p1" } } }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: "parent", first_name: "Ana", last_name: "Rojas" },
        error: null,
      }),
    })),
  };
}

describe("sendParentReply", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(parentSession() as never);
    vi.mocked(sendParentReplyUseCase).mockResolvedValue({ ok: true, recipientRole: "admin" });
  });

  it("rejects a recipient id that is not a uuid", async () => {
    const res = await sendParentReply("en", "<p>Hi</p>", "admin");
    expect(res).toEqual({ ok: false, message: msg.invalidRecipient });
    expect(sendParentReplyUseCase).not.toHaveBeenCalled();
  });

  it("sends the reply to the chosen sender", async () => {
    const res = await sendParentReply(
      "en",
      "<p>Hi</p>",
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    );
    expect(res).toEqual({ ok: true });
    expect(sendParentReplyUseCase).toHaveBeenCalledWith(
      expect.objectContaining({
        parentId: "p1",
        recipientId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      }),
    );
  });
});
