/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const chain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn(),
};

const mockFrom = vi.fn(() => chain);

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: mockFrom,
  })),
}));

import { getPublicCtaMode } from "@/lib/settings/getPublicCtaMode";

describe("getPublicCtaMode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chain.maybeSingle.mockResolvedValue({ data: null });
  });

  it("defaults to reserve when the setting is missing", async () => {
    await expect(getPublicCtaMode()).resolves.toBe("reserve");
    expect(mockFrom).toHaveBeenCalledWith("site_settings");
    expect(chain.eq).toHaveBeenCalledWith("key", "public_cta_mode");
  });

  it("returns the stored site mode", async () => {
    chain.maybeSingle.mockResolvedValue({ data: { value: "both" } });
    await expect(getPublicCtaMode()).resolves.toBe("both");
  });

  it("falls back to reserve for unexpected shapes", async () => {
    chain.maybeSingle.mockResolvedValue({ data: { value: { mode: "trial" } } });
    await expect(getPublicCtaMode()).resolves.toBe("reserve");
  });
});
