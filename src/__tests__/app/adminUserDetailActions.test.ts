// REGRESSION CHECK: Admin detail mutations must stay behind assertAdmin; profile updates use auth admin.
import { describe, it, expect, vi, beforeEach } from "vitest";
import es from "@/dictionaries/es.json";
import {
  updateAdminUserDetailFieldAction,
  updateAdminUserDetailHomeAddressAction,
  setAdminUserPasswordFromDetailAction,
} from "@/app/[locale]/dashboard/admin/users/adminUserDetailActions";

const U = es.admin.users;

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: vi.fn().mockResolvedValue({ ok: true }),
}));

const mockAssertAdmin = vi.fn();
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

const hoisted = vi.hoisted(() => ({
  loadTutorStudentFamilyClusterIds: vi.fn(),
}));

vi.mock("@/lib/dashboard/loadTutorStudentFamilyClusterIds", () => ({
  loadTutorStudentFamilyClusterIds: hoisted.loadTutorStudentFamilyClusterIds,
}));

const mockUpdateUserById = vi.fn();
const mockGetUserById = vi.fn();
const mockProfilesUpdateEq = vi.fn();
const mockProfilesUpdateIn = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        getUserById: (...a: unknown[]) => mockGetUserById(...a),
        updateUserById: (...a: unknown[]) => mockUpdateUserById(...a),
      },
    },
    from: (table: string) => {
      if (table === "profiles") {
        return {
          update: () => ({
            eq: mockProfilesUpdateEq,
            in: mockProfilesUpdateIn,
          }),
          select: () => ({
            eq: () => ({
              single: () => ({ data: { role: "student" }, error: null }),
            }),
          }),
        };
      }
      throw new Error(`unexpected ${table}`);
    },
  }),
}));

describe("adminUserDetailActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertAdmin.mockResolvedValue({});
    mockGetUserById.mockResolvedValue({
      data: { user: { user_metadata: { first_name: "A" } } },
      error: null,
    });
    mockUpdateUserById.mockResolvedValue({ error: null });
    mockProfilesUpdateEq.mockResolvedValue({ error: null });
    mockProfilesUpdateIn.mockResolvedValue({ error: null });
    hoisted.loadTutorStudentFamilyClusterIds.mockReset();
  });

  it("updateAdminUserDetailFieldAction rejects forbidden session", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("no"));
    const r = await updateAdminUserDetailFieldAction({
      locale: "es",
      targetUserId: "00000000-0000-4000-8000-000000000001",
      field: "email",
      value: "x@y.com",
    });
    expect(r).toEqual({ ok: false, message: U.detailErrForbidden });
  });

  it("updates email via auth admin", async () => {
    const r = await updateAdminUserDetailFieldAction({
      locale: "es",
      targetUserId: "00000000-0000-4000-8000-000000000001",
      field: "email",
      value: "  NEW@MAIL.COM ",
    });
    expect(r.ok).toBe(true);
    expect(mockUpdateUserById).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
      expect.objectContaining({ email: "new@mail.com", email_confirm: true }),
    );
  });

  it("updateAdminUserDetailHomeAddressAction saves normalized address", async () => {
    const r = await updateAdminUserDetailHomeAddressAction({
      locale: "es",
      targetUserId: "00000000-0000-4000-8000-000000000001",
      homeAddressText: "  Av. Siempre Viva 742 ",
      homePlaceId: "ChIJxyz",
    });
    expect(r.ok).toBe(true);
    expect(mockProfilesUpdateEq).toHaveBeenCalled();
    expect(mockUpdateUserById).toHaveBeenCalled();
  });

  it("updateAdminUserDetailHomeAddressAction rejects overly long text", async () => {
    const r = await updateAdminUserDetailHomeAddressAction({
      locale: "es",
      targetUserId: "00000000-0000-4000-8000-000000000001",
      homeAddressText: `${"x".repeat(501)}`,
      homePlaceId: null,
    });
    expect(r.ok).toBe(false);
    expect(r.message).toBe(U.detailErr_home_address_too_long);
  });

  const uid1 = "00000000-0000-4000-8000-000000000001";
  const uid2 = "00000000-0000-4000-8000-000000000002";

  it("updateAdminUserDetailHomeAddressAction bulk-applies when applyToFamily is true", async () => {
    hoisted.loadTutorStudentFamilyClusterIds.mockResolvedValue([uid1, uid2]);
    const r = await updateAdminUserDetailHomeAddressAction({
      locale: "es",
      targetUserId: uid1,
      homeAddressText: "Calle Falsa 123",
      homePlaceId: null,
      applyToFamily: true,
    });
    expect(r.ok).toBe(true);
    expect(hoisted.loadTutorStudentFamilyClusterIds).toHaveBeenCalled();
    expect(mockProfilesUpdateIn).toHaveBeenCalledWith("id", expect.arrayContaining([uid1, uid2]));
    expect(mockProfilesUpdateEq).not.toHaveBeenCalled();
    expect(mockUpdateUserById).toHaveBeenCalledTimes(2);
  });

  it("updateAdminUserDetailHomeAddressAction ignores applyToFamily when clearing address", async () => {
    hoisted.loadTutorStudentFamilyClusterIds.mockResolvedValue([uid1, uid2]);
    const r = await updateAdminUserDetailHomeAddressAction({
      locale: "es",
      targetUserId: uid1,
      homeAddressText: "   ",
      homePlaceId: null,
      applyToFamily: true,
    });
    expect(r.ok).toBe(true);
    expect(hoisted.loadTutorStudentFamilyClusterIds).not.toHaveBeenCalled();
    expect(mockProfilesUpdateIn).not.toHaveBeenCalled();
    expect(mockProfilesUpdateEq).toHaveBeenCalled();
  });

  it("updateAdminUserDetailHomeAddressAction updates only target when applyToFamily is false", async () => {
    hoisted.loadTutorStudentFamilyClusterIds.mockResolvedValue([uid1, uid2]);
    const r = await updateAdminUserDetailHomeAddressAction({
      locale: "es",
      targetUserId: uid1,
      homeAddressText: "Una calle",
      homePlaceId: null,
      applyToFamily: false,
    });
    expect(r.ok).toBe(true);
    expect(hoisted.loadTutorStudentFamilyClusterIds).not.toHaveBeenCalled();
    expect(mockProfilesUpdateIn).not.toHaveBeenCalled();
    expect(mockProfilesUpdateEq).toHaveBeenCalled();
    expect(mockUpdateUserById).toHaveBeenCalledTimes(1);
  });

  it("setAdminUserPasswordFromDetailAction rejects short password schema", async () => {
    const r = await setAdminUserPasswordFromDetailAction({
      locale: "es",
      targetUserId: "00000000-0000-4000-8000-000000000001",
      password: "short",
      confirmed: true,
    });
    expect(r.ok).toBe(false);
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });

  it("setAdminUserPasswordFromDetailAction succeeds with 8+ chars", async () => {
    const r = await setAdminUserPasswordFromDetailAction({
      locale: "es",
      targetUserId: "00000000-0000-4000-8000-000000000001",
      password: "12345678",
      confirmed: true,
    });
    expect(r.ok).toBe(true);
    expect(mockUpdateUserById).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
      expect.objectContaining({ password: "12345678" }),
    );
  });
});
