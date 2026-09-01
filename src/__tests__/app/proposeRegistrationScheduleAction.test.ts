/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  assertAdmin: vi.fn(),
  createAdmin: vi.fn(),
  getDictionary: vi.fn(),
  proposeCore: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mocks.assertAdmin(),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mocks.createAdmin(),
}));
vi.mock("@/lib/i18n/dictionaries", () => ({
  getDictionary: mocks.getDictionary,
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerAuthzDenied: vi.fn(),
  logSupabaseClientError: vi.fn(),
}));
vi.mock("@/app/[locale]/dashboard/admin/academic/revalidatePaths", () => ({
  revalidateAcademicSurfaces: vi.fn(),
}));
vi.mock("@/lib/register/proposeRegistrationScheduleCore", () => ({
  proposeRegistrationScheduleCore: mocks.proposeCore,
}));

import { proposeRegistrationScheduleAction } from "@/app/[locale]/dashboard/admin/registrations/proposeRegistrationScheduleAction";

const REG_ID = "123e4567-e89b-12d3-a456-426614174000";
const SEC_ID = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.assertAdmin.mockResolvedValue({ supabase: { kind: "admin-session" }, user: { id: "admin-1" } });
  mocks.getDictionary.mockResolvedValue({
    register: { enrollmentPayUndecidedSection: "horario" },
    admin: { registrations: {} },
  });
  mocks.createAdmin.mockReturnValue({ kind: "admin-client" });
  mocks.proposeCore.mockResolvedValue({ ok: true });
});

describe("proposeRegistrationScheduleAction", () => {
  it("returns forbidden when assertAdmin throws", async () => {
    mocks.assertAdmin.mockRejectedValue(new Error("no"));
    const r = await proposeRegistrationScheduleAction({
      locale: "es",
      registrationId: REG_ID,
      sectionId: SEC_ID,
    });
    expect(r).toEqual({ ok: false, code: "forbidden" });
    expect(mocks.proposeCore).not.toHaveBeenCalled();
  });

  it("delegates to core with the admin client and returns ok", async () => {
    const r = await proposeRegistrationScheduleAction({
      locale: "es",
      registrationId: REG_ID,
      sectionId: SEC_ID,
    });
    expect(r).toEqual({ ok: true });
    expect(mocks.proposeCore).toHaveBeenCalledWith({
      admin: { kind: "admin-client" },
      locale: "es",
      dict: expect.any(Object),
      registrationId: REG_ID,
      sectionId: SEC_ID,
    });
  });

  it("surfaces section_full from core", async () => {
    mocks.proposeCore.mockResolvedValue({ ok: false, code: "section_full" });
    const r = await proposeRegistrationScheduleAction({
      locale: "es",
      registrationId: REG_ID,
      sectionId: SEC_ID,
    });
    expect(r).toEqual({ ok: false, code: "section_full" });
  });
});
