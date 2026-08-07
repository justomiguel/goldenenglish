import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  markAdminPortalMessageRead,
  markAdminPortalMessageUnread,
} from "@/lib/messaging/markAdminPortalMessageAttention";

// REGRESSION CHECK: Staff must be able to clear read_at to mark a message unread again.

describe("markAdminPortalMessageAttention", () => {
  it("sets read_at when marking read", async () => {
    const is = vi.fn().mockResolvedValue({ error: null });
    const eq = vi.fn().mockReturnValue({ is });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });
    const supabase = { from } as unknown as SupabaseClient;

    await markAdminPortalMessageRead(supabase, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");

    expect(from).toHaveBeenCalledWith("portal_messages");
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ read_at: expect.any(String) }),
    );
    expect(eq).toHaveBeenCalledWith("id", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    expect(is).toHaveBeenCalledWith("read_at", null);
  });

  it("clears read_at when marking unread", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });
    const supabase = { from } as unknown as SupabaseClient;

    await markAdminPortalMessageUnread(supabase, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");

    expect(update).toHaveBeenCalledWith({ read_at: null });
    expect(eq).toHaveBeenCalledWith("id", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  });
});
