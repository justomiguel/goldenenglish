import { describe, expect, it, vi } from "vitest";
import { loadAdminRecentInboundMessageCount } from "@/lib/dashboard/loadAdminRecentInboundMessageCount";
import { PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID } from "@/lib/site/publicSiteContactSenderId";

describe("loadAdminRecentInboundMessageCount", () => {
  it("counts unread received rows the inbox lists", async () => {
    const or = vi.fn().mockResolvedValue({ count: 4, error: null });
    const is = vi.fn(() => ({ or }));
    const eq = vi.fn(() => ({ is }));
    const select = vi.fn(() => ({ eq }));
    const supabase = {
      from: vi.fn(() => ({ select })),
    };

    await expect(loadAdminRecentInboundMessageCount(supabase as never, "uid-1")).resolves.toBe(4);
    expect(supabase.from).toHaveBeenCalledWith("portal_messages");
    expect(eq).toHaveBeenCalledWith("recipient_id", "uid-1");
    expect(is).toHaveBeenCalledWith("read_at", null);
    expect(or).toHaveBeenCalledWith(
      expect.stringContaining(`id.eq.${PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID}`),
      { referencedTable: "sender" },
    );
    expect(String(or.mock.calls[0]?.[0])).toContain("role.in.(teacher,admin,student,parent)");
  });

  it("returns 0 when Supabase returns an error", async () => {
    const or = vi.fn().mockResolvedValue({
      count: null,
      error: { message: "boom", code: "PGRST301", details: "", hint: "" },
    });
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ is: vi.fn(() => ({ or })) })),
        })),
      })),
    };
    await expect(loadAdminRecentInboundMessageCount(supabase as never, "uid-2")).resolves.toBe(0);
  });

  it("returns 0 when the count is null", async () => {
    const or = vi.fn().mockResolvedValue({ count: null, error: null });
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ is: vi.fn(() => ({ or })) })),
        })),
      })),
    };
    await expect(loadAdminRecentInboundMessageCount(supabase as never, "uid-3")).resolves.toBe(0);
  });
});
