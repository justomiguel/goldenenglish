import { describe, it, expect, vi, beforeEach } from "vitest";
import { setInscriptionsEnabled } from "@/app/[locale]/dashboard/admin/settings/actions";
import { setMerchEnabled } from "@/app/[locale]/dashboard/admin/settings/setMerchEnabled";
import { setRegisterShowAllSections } from "@/app/[locale]/dashboard/admin/settings/setRegisterShowAllSections";

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

describe("setMerchEnabled", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ok false when admin check fails", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("no"));
    expect(await setMerchEnabled("es", true)).toEqual({ ok: false });
  });

  it("returns ok false when upsert fails", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockCreateClient.mockResolvedValue({
      from: () => ({
        upsert: vi.fn().mockResolvedValue({ error: { message: "e" } }),
      }),
    });
    expect(await setMerchEnabled("es", true)).toEqual({ ok: false });
  });

  it("returns ok true after revalidation paths", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockCreateClient.mockResolvedValue({
      from: () => ({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    expect(await setMerchEnabled("en", false)).toEqual({ ok: true });
  });
});

describe("setRegisterShowAllSections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ok false when admin check fails", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("no"));
    expect(await setRegisterShowAllSections("es", true)).toEqual({ ok: false });
  });

  it("returns ok true after revalidation paths", async () => {
    mockAssertAdmin.mockResolvedValue({});
    mockCreateClient.mockResolvedValue({
      from: () => ({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    expect(await setRegisterShowAllSections("en", true)).toEqual({ ok: true });
  });
});
