import { describe, expect, it, vi } from "vitest";
import { loadAdminRecentInboundMessageCount } from "@/lib/dashboard/loadAdminRecentInboundMessageCount";

describe("loadAdminRecentInboundMessageCount", () => {
  it("returns PostgREST count when query succeeds", async () => {
    const chain = {
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ count: 12, error: null }),
    };
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => chain),
      })),
    };
    await expect(loadAdminRecentInboundMessageCount(supabase as never, "uid-1")).resolves.toBe(12);
    expect(supabase.from).toHaveBeenCalledWith("portal_messages");
    expect(chain.eq).toHaveBeenCalledWith("recipient_id", "uid-1");
  });

  it("returns 0 when Supabase returns an error", async () => {
    const chain = {
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({
        count: null,
        error: { message: "boom", code: "PGRST301", details: "", hint: "" },
      }),
    };
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => chain),
      })),
    };
    await expect(loadAdminRecentInboundMessageCount(supabase as never, "uid-2")).resolves.toBe(0);
  });
});
