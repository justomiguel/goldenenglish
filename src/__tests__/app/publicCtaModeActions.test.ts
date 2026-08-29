import { describe, it, expect, vi, beforeEach } from "vitest";
import { setPublicCtaMode } from "@/app/[locale]/dashboard/admin/settings/publicCtaModeActions";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockAssertAdmin = vi.fn();
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

const mockCreateClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

describe("setPublicCtaMode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ok false when admin check fails", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("no"));
    expect(await setPublicCtaMode("es", "both")).toEqual({ ok: false });
  });

  it("rejects an unknown mode", async () => {
    mockAssertAdmin.mockResolvedValue({});
    expect(await setPublicCtaMode("es", "maybe")).toEqual({ ok: false });
  });

  it("returns ok true after upsert", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockCreateClient.mockResolvedValue({
      from: () => ({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    expect(await setPublicCtaMode("en", "both")).toEqual({ ok: true });
  });
});
