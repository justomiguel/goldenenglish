/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { recordRetentionWhatsappContactAction } from "@/app/[locale]/dashboard/admin/retentionActions";

const COH = "00000000-0000-4000-8000-000000000020";
const ENR = "00000000-0000-4000-8000-000000000040";

const { mockLoadRetention, mockAssertAdmin, userRpc, revalidatePath } = vi.hoisted(() => ({
  mockLoadRetention: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
  mockAssertAdmin: vi.fn(),
  userRpc: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/academics/loadAdminRetentionCandidates", () => ({
  loadAdminRetentionCandidates: (a: unknown, b: unknown) => mockLoadRetention(a, b),
}));

vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

describe("recordRetentionWhatsappContactAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userRpc.mockResolvedValue({ data: null, error: null });
    mockLoadRetention.mockResolvedValue({ rows: [], total: 0 });
    mockAssertAdmin.mockResolvedValue({
      supabase: { rpc: userRpc },
      user: { id: "00000000-0000-4000-8000-0000000000ad" },
    });
  });

  it("returns parse for invalid input", async () => {
    const res = await recordRetentionWhatsappContactAction({ cohortId: "x" });
    expect(res).toEqual({ ok: false, code: "parse" });
    expect(userRpc).not.toHaveBeenCalled();
  });

  it("increments whatsapp count, revalidates, and returns ok", async () => {
    const res = await recordRetentionWhatsappContactAction({
      locale: "es",
      cohortId: COH,
      enrollmentId: ENR,
    });
    expect(res).toEqual({ ok: true });
    expect(userRpc).toHaveBeenCalledWith("increment_enrollment_retention_contact", {
      p_enrollment_id: ENR,
      p_channel: "whatsapp",
    });
    expect(revalidatePath).toHaveBeenCalledWith(`/es/dashboard/admin/academic/${COH}`, "page");
  });

  it("returns save when rpc fails", async () => {
    userRpc.mockResolvedValueOnce({ data: null, error: { message: "rpc err" } });
    const res = await recordRetentionWhatsappContactAction({
      locale: "en",
      cohortId: COH,
      enrollmentId: ENR,
    });
    expect(res).toEqual({ ok: false, code: "save" });
  });
});
