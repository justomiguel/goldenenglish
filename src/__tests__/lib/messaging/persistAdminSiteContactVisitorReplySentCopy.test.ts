import { describe, expect, it, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID } from "@/lib/site/publicSiteContactSenderId";

const insertMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () =>
    ({
      from: (table: string) => {
        if (table !== "portal_messages") throw new Error(`unexpected table ${table}`);
        return { insert: insertMock };
      },
    }) as unknown as SupabaseClient,
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
}));

describe("persistAdminSiteContactVisitorReplySentCopy", () => {
  beforeEach(() => {
    insertMock.mockReset();
    insertMock.mockResolvedValue({ error: null });
  });

  it("inserts outbound portal_messages row to the site_contact system profile", async () => {
    const { persistAdminSiteContactVisitorReplySentCopy } = await import(
      "@/lib/messaging/persistAdminSiteContactVisitorReplySentCopy"
    );

    const result = await persistAdminSiteContactVisitorReplySentCopy({
      adminUserId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      bodyHtml: "<p>Thanks for writing</p>",
      visitorEmail: "visitor@example.com",
      visitorDisplayName: "Visitor Name",
    });

    expect(result).toEqual({ ok: true });
    expect(insertMock).toHaveBeenCalledWith({
      sender_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      recipient_id: PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID,
      body_html: "<p>Thanks for writing</p>",
      external_contact_reply_email: "visitor@example.com",
      external_contact_display_name: "Visitor Name",
      read_at: expect.any(String),
    });
  });

  it("returns ok:false and logs when insert fails", async () => {
    insertMock.mockResolvedValue({ error: { message: "boom", code: "42501" } });
    const { logSupabaseClientError } = await import("@/lib/logging/serverActionLog");
    const { persistAdminSiteContactVisitorReplySentCopy } = await import(
      "@/lib/messaging/persistAdminSiteContactVisitorReplySentCopy"
    );

    const result = await persistAdminSiteContactVisitorReplySentCopy({
      adminUserId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      bodyHtml: "<p>x</p>",
      visitorEmail: "v@example.com",
      visitorDisplayName: null,
    });

    expect(result).toEqual({ ok: false });
    expect(logSupabaseClientError).toHaveBeenCalled();
  });
});
