/** @vitest-environment node */
// REGRESSION CHECK: Institute staff cannot write the monthly mail cap.
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreateClient = vi.fn();

vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: vi.fn(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerAuthzDenied: vi.fn(),
  logSupabaseClientError: vi.fn(),
}));

describe("setEmailMonthlyCapAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects every caller", async () => {
    const { setEmailMonthlyCapAction } = await import(
      "@/app/[locale]/dashboard/admin/settings/emailSendsSettingsActions"
    );
    await expect(setEmailMonthlyCapAction({ locale: "es", cap: 4000 })).resolves.toEqual({
      ok: false,
      code: "forbidden",
    });
    expect(mockCreateClient).not.toHaveBeenCalled();
  });
});
