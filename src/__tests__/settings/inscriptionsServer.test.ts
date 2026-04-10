import { describe, it, expect, vi, beforeEach } from "vitest";

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

import { getInscriptionsEnabled } from "@/lib/settings/inscriptionsServer";

describe("getInscriptionsEnabled", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chain.maybeSingle.mockResolvedValue({ data: null });
  });

  it("returns true when row missing", async () => {
    await expect(getInscriptionsEnabled()).resolves.toBe(true);
    expect(mockFrom).toHaveBeenCalledWith("site_settings");
  });

  it("reads boolean jsonb", async () => {
    chain.maybeSingle.mockResolvedValue({ data: { value: false } });
    await expect(getInscriptionsEnabled()).resolves.toBe(false);
  });

  it("reads nested enabled", async () => {
    chain.maybeSingle.mockResolvedValue({
      data: { value: { enabled: true } },
    });
    await expect(getInscriptionsEnabled()).resolves.toBe(true);
  });

  it("defaults to true for unexpected value shapes", async () => {
    chain.maybeSingle.mockResolvedValue({ data: { value: "yes" } });
    await expect(getInscriptionsEnabled()).resolves.toBe(true);
  });
});
