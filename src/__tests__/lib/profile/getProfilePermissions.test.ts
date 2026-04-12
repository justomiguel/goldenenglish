import { describe, it, expect, vi } from "vitest";
import { getProfilePermissions } from "@/lib/profile/getProfilePermissions";

describe("getProfilePermissions", () => {
  it("denies payments module when profile is minor", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { is_minor: true },
          error: null,
        }),
      })),
    };
    const r = await getProfilePermissions(supabase as never, "u1");
    expect(r?.canAccessPaymentsModule).toBe(false);
    expect(r?.isMinor).toBe(true);
  });

  it("allows payments module when not minor", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { is_minor: false },
          error: null,
        }),
      })),
    };
    const r = await getProfilePermissions(supabase as never, "u1");
    expect(r?.canAccessPaymentsModule).toBe(true);
    expect(r?.isMinor).toBe(false);
  });
});
