import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import en from "@/dictionaries/en.json";
import { loadAdminPortalMessagesMailbox } from "@/lib/dashboard/loadAdminPortalMessagesMailbox";
import { PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID } from "@/lib/site/publicSiteContactSenderId";

// REGRESSION CHECK: Parent→administration must appear in Received; To must be Administration, not the admin's name.
// Unread / needsReply must sort ahead of handled mail; teacher DMs keep real recipient names.

const dict = en;
const adminId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const parentId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const teacherId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function mockMailboxSupabase(msgs: Record<string, unknown>[], profiles: Record<string, unknown>[]) {
  const order = vi.fn().mockReturnValue({
    limit: vi.fn().mockResolvedValue({ data: msgs, error: null }),
  });
  const portalSelect = vi.fn().mockReturnValue({
    or: vi.fn().mockReturnValue({ order }),
    eq: vi.fn().mockReturnValue({ order }),
    order,
  });

  const from = vi.fn().mockImplementation((table: string) => {
    if (table === "portal_messages") {
      return { select: portalSelect };
    }
    if (table === "profiles") {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: profiles, error: null }),
        }),
      };
    }
    return {};
  });

  return { from } as unknown as SupabaseClient;
}

describe("loadAdminPortalMessagesMailbox", () => {
  it("labels parent→admin administration mail as Administration and flags unread/needsReply", async () => {
    const msgs = [
      {
        id: "m1",
        sender_id: parentId,
        recipient_id: adminId,
        body_html: "<p>Help</p>",
        created_at: "2026-07-11T12:00:00.000Z",
        broadcast_batch_id: "batch-1",
        read_at: null,
        external_replied_at: null,
      },
    ];
    const profiles = [
      { id: parentId, first_name: "Pat", last_name: "Parent", role: "parent" },
      { id: adminId, first_name: "Ada", last_name: "Admin", role: "admin" },
    ];
    const supabase = mockMailboxSupabase(msgs, profiles);
    const { inboxRows } = await loadAdminPortalMessagesMailbox(supabase, adminId, dict);

    expect(inboxRows).toHaveLength(1);
    expect(inboxRows[0]?.toName).toBe(dict.admin.messages.administrationPeerLabel);
    expect(inboxRows[0]?.fromRole).toBe(dict.admin.messages.roleParent);
    expect(inboxRows[0]?.isUnread).toBe(true);
    expect(inboxRows[0]?.needsReply).toBe(true);
  });

  it("keeps teacher→admin DM recipient as the admin profile name", async () => {
    const msgs = [
      {
        id: "m2",
        sender_id: teacherId,
        recipient_id: adminId,
        body_html: "<p>Hi</p>",
        created_at: "2026-07-11T13:00:00.000Z",
        broadcast_batch_id: null,
        read_at: "2026-07-11T14:00:00.000Z",
        external_replied_at: null,
      },
    ];
    const profiles = [
      { id: teacherId, first_name: "Tina", last_name: "Teacher", role: "teacher" },
      { id: adminId, first_name: "Ada", last_name: "Admin", role: "admin" },
    ];
    const supabase = mockMailboxSupabase(msgs, profiles);
    const { inboxRows } = await loadAdminPortalMessagesMailbox(supabase, adminId, dict);

    expect(inboxRows).toHaveLength(1);
    expect(inboxRows[0]?.toName).toContain("Admin");
    expect(inboxRows[0]?.toName).not.toBe(dict.admin.messages.administrationPeerLabel);
    expect(inboxRows[0]?.isUnread).toBe(false);
    expect(inboxRows[0]?.needsReply).toBe(true);
  });

  it("clears needsReply when a later admin message to the peer exists", async () => {
    const msgs = [
      {
        id: "inbound",
        sender_id: parentId,
        recipient_id: adminId,
        body_html: "<p>Help</p>",
        created_at: "2026-07-11T12:00:00.000Z",
        broadcast_batch_id: "batch-1",
        read_at: "2026-07-11T12:30:00.000Z",
        external_replied_at: null,
      },
      {
        id: "reply",
        sender_id: adminId,
        recipient_id: parentId,
        body_html: "<p>Ok</p>",
        created_at: "2026-07-11T13:00:00.000Z",
        broadcast_batch_id: null,
        read_at: null,
        external_replied_at: null,
      },
    ];
    const profiles = [
      { id: parentId, first_name: "Pat", last_name: "Parent", role: "parent" },
      { id: adminId, first_name: "Ada", last_name: "Admin", role: "admin" },
    ];
    const supabase = mockMailboxSupabase(msgs, profiles);
    const { inboxRows } = await loadAdminPortalMessagesMailbox(supabase, adminId, dict);

    expect(inboxRows).toHaveLength(1);
    expect(inboxRows[0]?.needsReply).toBe(false);
    expect(inboxRows[0]?.isUnread).toBe(false);
  });

  it("labels site_contact inbound with visitor name, contact_form source, Administration To", async () => {
    const msgs = [
      {
        id: "m3",
        sender_id: PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID,
        recipient_id: adminId,
        body_html:
          '<p><strong>Asunto</strong> Otros</p><p><strong>Nombre</strong> Juan Pérez</p><p><strong>Email</strong> j@ex.com</p><hr /><p>Web</p>',
        created_at: "2026-07-11T14:00:00.000Z",
        broadcast_batch_id: "batch-web",
        read_at: null,
        external_replied_at: null,
        external_contact_display_name: "Juan Pérez",
      },
    ];
    const profiles = [
      {
        id: PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID,
        first_name: "Site",
        last_name: "Contact",
        role: "site_contact",
      },
      { id: adminId, first_name: "Ada", last_name: "Admin", role: "admin" },
    ];
    const supabase = mockMailboxSupabase(msgs, profiles);
    const { inboxRows } = await loadAdminPortalMessagesMailbox(supabase, adminId, dict);

    expect(inboxRows).toHaveLength(1);
    expect(inboxRows[0]?.fromName).toBe("Juan Pérez");
    expect(inboxRows[0]?.fromName).not.toContain("Site");
    expect(inboxRows[0]?.toName).toBe(dict.admin.messages.administrationPeerLabel);
    expect(inboxRows[0]?.source).toBe("contact_form");
    expect(inboxRows[0]?.needsReply).toBe(true);
  });

  it("sorts attention rows before handled", async () => {
    const msgs = [
      {
        id: "handled",
        sender_id: teacherId,
        recipient_id: adminId,
        body_html: "<p>Old</p>",
        created_at: "2026-07-11T18:00:00.000Z",
        broadcast_batch_id: null,
        read_at: "2026-07-11T18:01:00.000Z",
        external_replied_at: null,
      },
      {
        id: "unread",
        sender_id: parentId,
        recipient_id: adminId,
        body_html: "<p>New</p>",
        created_at: "2026-07-10T10:00:00.000Z",
        broadcast_batch_id: "b",
        read_at: null,
        external_replied_at: null,
      },
      {
        id: "admin-reply-to-teacher",
        sender_id: adminId,
        recipient_id: teacherId,
        body_html: "<p>Done</p>",
        created_at: "2026-07-11T19:00:00.000Z",
        broadcast_batch_id: null,
        read_at: null,
        external_replied_at: null,
      },
    ];
    const profiles = [
      { id: parentId, first_name: "Pat", last_name: "Parent", role: "parent" },
      { id: teacherId, first_name: "Tina", last_name: "Teacher", role: "teacher" },
      { id: adminId, first_name: "Ada", last_name: "Admin", role: "admin" },
    ];
    const supabase = mockMailboxSupabase(msgs, profiles);
    const { inboxRows } = await loadAdminPortalMessagesMailbox(supabase, adminId, dict);

    expect(inboxRows.map((r) => r.id)).toEqual(["unread", "handled"]);
    expect(inboxRows[0]?.isUnread).toBe(true);
    expect(inboxRows[1]?.needsReply).toBe(false);
  });

  it("labels Sent contact-form email replies with the visitor as To", async () => {
    const msgs = [
      {
        id: "sent-external",
        sender_id: adminId,
        recipient_id: PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID,
        body_html: "<p>Thanks for writing</p>",
        created_at: "2026-07-12T15:00:00.000Z",
        broadcast_batch_id: null,
        read_at: "2026-07-12T15:00:00.000Z",
        external_replied_at: null,
        external_contact_display_name: "Visitor Name",
        external_contact_reply_email: "visitor@example.com",
      },
    ];
    const profiles = [
      { id: adminId, first_name: "Ada", last_name: "Admin", role: "admin" },
      {
        id: PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID,
        first_name: "Site",
        last_name: "contact form",
        role: "site_contact",
      },
    ];
    const supabase = mockMailboxSupabase(msgs, profiles);
    const { sentRows } = await loadAdminPortalMessagesMailbox(supabase, adminId, dict);

    expect(sentRows).toHaveLength(1);
    expect(sentRows[0]?.toName).toBe("Visitor Name");
    expect(sentRows[0]?.toName).not.toMatch(/contact form/i);
  });
});
