/** @vitest-environment node */
// REGRESSION CHECK: A cap of 0 must not be stored. A valid cap writes the
// site setting and audits the change.
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAssertAdmin = vi.fn();
const mockCreateClient = vi.fn();
const recordSystemAudit = vi.fn();
const revalidatePath = vi.fn();

vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit,
}));
vi.mock("next/cache", () => ({
  revalidatePath,
}));

describe("setEmailMonthlyCapAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertAdmin.mockResolvedValue({ user: { id: "admin" } });
  });

  it("rejects 0", async () => {
    const { setEmailMonthlyCapAction } = await import(
      "@/app/[locale]/dashboard/admin/settings/emailSendsSettingsActions"
    );
    const result = await setEmailMonthlyCapAction({ locale: "es", cap: 0 });
    expect(result).toEqual({ ok: false, code: "invalid_cap" });
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("writes the cap and audits it", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    mockCreateClient.mockResolvedValue({ from: () => ({ upsert }) });
    const { setEmailMonthlyCapAction } = await import(
      "@/app/[locale]/dashboard/admin/settings/emailSendsSettingsActions"
    );
    const result = await setEmailMonthlyCapAction({ locale: "es", cap: 4000 });
    expect(result).toEqual({ ok: true });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ key: "email_monthly_cap", value: 4000 }),
      { onConflict: "key" },
    );
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "email_monthly_cap_upsert",
        resourceId: "email_monthly_cap",
        payload: { cap: 4000 },
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/es/dashboard/admin");
  });
});
