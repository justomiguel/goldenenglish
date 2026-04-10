import { describe, it, expect, vi, beforeEach } from "vitest";
import { setInscriptionsEnabled } from "@/app/[locale]/dashboard/admin/settings/actions";

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

describe("setInscriptionsEnabled", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ok false when admin check fails", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("no"));
    expect(await setInscriptionsEnabled("es", true)).toEqual({ ok: false });
  });

  it("returns ok false when upsert fails", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockCreateClient.mockResolvedValue({
      from: () => ({
        upsert: vi.fn().mockResolvedValue({ error: { message: "e" } }),
      }),
    });
    expect(await setInscriptionsEnabled("es", true)).toEqual({ ok: false });
  });

  it("returns ok true after revalidation paths", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockCreateClient.mockResolvedValue({
      from: () => ({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    expect(await setInscriptionsEnabled("en", false)).toEqual({ ok: true });
  });
});
