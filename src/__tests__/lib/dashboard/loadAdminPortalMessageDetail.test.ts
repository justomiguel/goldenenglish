import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import en from "@/dictionaries/en.json";
import { loadAdminPortalMessageDetail } from "@/lib/dashboard/loadAdminPortalMessageDetail";

const dict = en;

describe("loadAdminPortalMessageDetail", () => {
  it("returns null when no row", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "portal_messages") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ maybeSingle }),
          }),
        };
      }
      return {};
    });
    const supabase = { from } as unknown as SupabaseClient;
    const r = await loadAdminPortalMessageDetail(supabase, dict, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    expect(r).toBeNull();
  });

  it("loads sanitized display HTML and participant labels", async () => {
    const messageId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const senderId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const recipientId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: messageId,
        sender_id: senderId,
        recipient_id: recipientId,
        body_html: "<p>Hello <strong>there</strong></p>",
        created_at: "2026-05-01T12:00:00.000Z",
      },
      error: null,
    });

    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "portal_messages") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ maybeSingle }),
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [
                {
                  id: senderId,
                  first_name: "Ann",
                  last_name: "Teacher",
                  role: "teacher",
                },
                {
                  id: recipientId,
                  first_name: "Bob",
                  last_name: "Admin",
                  role: "admin",
                },
              ],
              error: null,
            }),
          }),
        };
      }
      return {};
    });

    const supabase = { from } as unknown as SupabaseClient;
    const r = await loadAdminPortalMessageDetail(supabase, dict, messageId);

    expect(r).not.toBeNull();
    expect(r!.bodyHtmlDisplay).toContain("Hello");
    expect(r!.bodyHtmlDisplay).toContain("there");
    expect(r!.previewSnippet).toContain("Hello");
    expect(r!.fromRoleLabel).toBe(dict.admin.messages.roleTeacher);
    expect(r!.toRoleLabel).toBe(dict.admin.messages.roleAdmin);
  });
});
