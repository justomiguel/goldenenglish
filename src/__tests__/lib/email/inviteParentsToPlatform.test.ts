import { describe, expect, it, vi } from "vitest";
import { inviteParentsToPlatform } from "@/lib/email/inviteParentsToPlatform";

describe("inviteParentsToPlatform", () => {
  it("writes a portal row for every parent and emails only deliverable mailboxes", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const generateRecoveryLink = vi.fn(async (email: string) => `https://reset.test/${email}`);
    const sendInviteEmail = vi.fn(async () => ({ ok: true }));
    const result = await inviteParentsToPlatform({
      supabase: { from: () => ({ insert }) } as never,
      senderId: "admin-1",
      parents: [
        { id: "p1", firstName: "Ana", lastName: "G", email: "ana@x.test", authEmail: "ana@x.test" },
        { id: "p2", firstName: "Luis", lastName: "P", email: null, authEmail: "123@parents.x" },
      ],
      portalUrl: "https://app.test/es/login",
      generateRecoveryLink,
      renderInvite: async (vars) => ({
        subject: `Hola ${vars.nombre}`,
        bodyHtml: `<p>${vars.resetUrl}</p>`,
      }),
      sendInviteEmail,
    });
    expect(insert).toHaveBeenCalledTimes(2);
    expect(generateRecoveryLink).toHaveBeenCalledTimes(2);
    expect(sendInviteEmail).toHaveBeenCalledTimes(1);
    expect(sendInviteEmail.mock.calls[0]?.[0]).toBe("ana@x.test");
    expect(result).toEqual({
      portalOk: 2,
      emailed: 1,
      skippedSynthetic: 1,
      failed: 0,
      persistFailed: 0,
    });
  });
});
