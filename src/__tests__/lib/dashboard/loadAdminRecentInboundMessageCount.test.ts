import { describe, expect, it, vi } from "vitest";
import { loadAdminRecentInboundMessageCount } from "@/lib/dashboard/loadAdminRecentInboundMessageCount";

describe("loadAdminRecentInboundMessageCount", () => {
  it("returns total inbound count for the recipient without a date window", async () => {
    const eq = vi.fn().mockResolvedValue({ count: 27, error: null });
    const select = vi.fn(() => ({ eq }));
    const supabase = {
      from: vi.fn(() => ({ select })),
    };

    await expect(loadAdminRecentInboundMessageCount(supabase as never, "uid-1")).resolves.toBe(27);
    expect(supabase.from).toHaveBeenCalledWith("portal_messages");
    expect(select).toHaveBeenCalledWith("id", { head: true, count: "exact" });
    expect(eq).toHaveBeenCalledWith("recipient_id", "uid-1");
    expect(eq.mock.calls.some((c) => String(c[0]).includes("created_at"))).toBe(false);
  });

  it("returns 0 when Supabase returns an error", async () => {
    const eq = vi.fn().mockResolvedValue({
      count: null,
      error: { message: "boom", code: "PGRST301", details: "", hint: "" },
    });
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({ eq })),
      })),
    };
    await expect(loadAdminRecentInboundMessageCount(supabase as never, "uid-2")).resolves.toBe(0);
  });
});
