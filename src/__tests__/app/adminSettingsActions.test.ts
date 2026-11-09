import { describe, it, expect, vi, beforeEach } from "vitest";
import { revalidatePath } from "next/cache";
import { setInscriptionsEnabled } from "@/app/[locale]/dashboard/admin/settings/actions";
import { setMerchEnabled } from "@/app/[locale]/dashboard/admin/settings/setMerchEnabled";
import { setRegisterSectionMode } from "@/app/[locale]/dashboard/admin/settings/setRegisterSectionMode";

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
    expect(revalidatePath).toHaveBeenCalledWith("/en/dashboard/admin/registrations");
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

describe("setRegisterSectionMode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ok false when admin check fails", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("no"));
    expect(await setRegisterSectionMode("es", "student_choice")).toEqual({ ok: false });
  });

  it("returns ok false for an unknown mode and does not write", async () => {
    mockAssertAdmin.mockResolvedValue({});
    const upsert = vi.fn();
    mockCreateClient.mockResolvedValue({
      from: () => ({ upsert }),
    });
    expect(await setRegisterSectionMode("es", "nope" as "student_choice")).toEqual({ ok: false });
    expect(upsert).not.toHaveBeenCalled();
  });

  it("upserts register_section_mode", async () => {
    mockAssertAdmin.mockResolvedValue({});
    const upsert = vi.fn().mockResolvedValue({ error: null });
    mockCreateClient.mockResolvedValue({
      from: () => ({ upsert }),
    });
    expect(await setRegisterSectionMode("en", "admin_assign")).toEqual({ ok: true });
    expect(revalidatePath).toHaveBeenCalledWith("/en/dashboard/admin/registrations");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "register_section_mode",
        value: "admin_assign",
      }),
      { onConflict: "key" },
    );
  });
});
