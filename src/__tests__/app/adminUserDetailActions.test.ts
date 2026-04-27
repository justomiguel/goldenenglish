// REGRESSION CHECK: Admin detail mutations must stay behind assertAdmin; profile updates use auth admin.
import { describe, it, expect, vi, beforeEach } from "vitest";
import es from "@/dictionaries/es.json";
import {
  updateAdminUserDetailFieldAction,
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

const mockUpdateUserById = vi.fn();
const mockGetUserById = vi.fn();
const mockProfilesUpdateEq = vi.fn();

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
          update: () => ({ eq: mockProfilesUpdateEq }),
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
