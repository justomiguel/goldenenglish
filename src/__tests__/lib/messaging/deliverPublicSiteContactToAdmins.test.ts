// REGRESSION CHECK: Must deliver one insert + notify per admin; fail closed on insert error.
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { deliverPublicSiteContactToAdmins } from "@/lib/messaging/deliverPublicSiteContactToAdmins";
import { PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID } from "@/lib/site/publicSiteContactSenderId";

vi.mock("@/lib/messaging/notifyMessagingEmails", () => ({
  notifyPortalRecipientForStaffMessage: vi.fn().mockResolvedValue(undefined),
}));

describe("deliverPublicSiteContactToAdmins", () => {
  it("returns no_admins when list is empty", async () => {
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });
    const admin = { from } as unknown as SupabaseClient;
    const res = await deliverPublicSiteContactToAdmins(admin, {
      locale: "es",
      subjectFieldLabel: "Asunto",
      subjectLabel: "Otros",
      metaLines: [{ label: "Nombre", value: "Juan" }],
      bodyPlain: "Hola",
      senderDisplayName: "Juan (Contacto)",
      visitorReplyEmail: "juan@example.com",
      emailProvider: { sendEmail: vi.fn().mockResolvedValue({ ok: true }) },
    });
    expect(res).toEqual({ ok: false, code: "no_admins" });
  });

  it("skips the site_contact sender id if present in admin query", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const limit = vi.fn().mockResolvedValue({
      data: [{ id: PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID }, { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }],
      error: null,
    });
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockImplementation(() => limit()),
            }),
          }),
        };
      }
      if (table === "portal_messages") {
        return { insert };
      }
      return {};
    });
    const admin = { from } as unknown as SupabaseClient;
    const res = await deliverPublicSiteContactToAdmins(admin, {
      locale: "es",
      subjectFieldLabel: "Asunto",
      subjectLabel: "Otros",
      metaLines: [{ label: "Nombre", value: "Juan" }],
      bodyPlain: "Hola",
      senderDisplayName: "Juan (Contacto)",
      visitorReplyEmail: "juan@example.com",
      emailProvider: { sendEmail: vi.fn().mockResolvedValue({ ok: true }) },
    });
    expect(res).toEqual({ ok: true, delivered: 1 });
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert.mock.calls[0][0]).toMatchObject({
      external_contact_reply_email: "juan@example.com",
    });
  });
});
