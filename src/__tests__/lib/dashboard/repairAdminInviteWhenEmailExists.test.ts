import { describe, it, expect, vi, beforeEach } from "vitest";
import { repairAdminInviteWhenEmailExists } from "@/lib/dashboard/repairAdminInviteWhenEmailExists";
import * as findMod from "@/lib/supabase/findAuthUserIdByNormalizedEmail";

vi.mock("@/lib/supabase/findAuthUserIdByNormalizedEmail", () => ({
  findAuthUserIdByNormalizedEmail: vi.fn(),
}));

const mockFind = vi.mocked(findMod.findAuthUserIdByNormalizedEmail);

const profileBase = {
  role: "student" as const,
  first_name: "A",
  last_name: "B",
  dni_or_passport: "1" as string | null,
  phone: "+1" as string | null,
  birth_date: undefined as string | undefined,
};

describe("repairAdminInviteWhenEmailExists", () => {
  const mockUpdateUserById = vi.fn();
  const mockMaybeSingle = vi.fn();
  const mockUpsert = vi.fn();

  const admin = {
    auth: {
      admin: {
        updateUserById: (...a: unknown[]) => mockUpdateUserById(...a),
      },
    },
    from: vi.fn((table: string) => {
      if (table !== "profiles") throw new Error(`unexpected ${table}`);
      return {
        upsert: mockUpsert,
        select: () => ({
          eq: () => ({ maybeSingle: mockMaybeSingle }),
        }),
      };
    }),
  } as unknown as import("@supabase/supabase-js").SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsert.mockResolvedValue({ error: null });
    mockUpdateUserById.mockResolvedValue({ data: { user: {} }, error: null });
  });

  it("returns failed list_users when Auth lookup errors", async () => {
    mockFind.mockResolvedValue({ userId: null, error: { message: "x" } });
    const r = await repairAdminInviteWhenEmailExists({
      admin,
      normalizedEmail: "x@y.com",
      password: "secret12",
      userMetadata: {},
      profile: profileBase,
    });
    expect(r).toEqual({ kind: "failed", diagnostic: "list_users" });
  });

  it("returns still_duplicate when no auth user id resolved", async () => {
    mockFind.mockResolvedValue({ userId: null, error: null });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const r = await repairAdminInviteWhenEmailExists({
      admin,
      normalizedEmail: "x@y.com",
      password: "secret12",
      userMetadata: { role: "student" },
      profile: profileBase,
    });
    expect(r).toEqual({ kind: "still_duplicate" });
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });

  it("returns still_duplicate when profile already exists", async () => {
    mockFind.mockResolvedValue({ userId: "u1", error: null });
    mockMaybeSingle.mockResolvedValue({ data: { id: "u1" }, error: null });
    const r = await repairAdminInviteWhenEmailExists({
      admin,
      normalizedEmail: "x@y.com",
      password: "secret12",
      userMetadata: {},
      profile: profileBase,
    });
    expect(r).toEqual({ kind: "still_duplicate" });
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });

  it("repairs orphan: updates auth and upserts profile", async () => {
    mockFind.mockResolvedValue({ userId: "u1", error: null });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const r = await repairAdminInviteWhenEmailExists({
      admin,
      normalizedEmail: "x@y.com",
      password: "secret12",
      userMetadata: { provisioning_source: "admin_invite", role: "student" },
      profile: profileBase,
    });
    expect(r).toEqual({ kind: "repaired", userId: "u1" });
    expect(mockUpdateUserById).toHaveBeenCalledWith("u1", {
      password: "secret12",
      email_confirm: true,
      user_metadata: { provisioning_source: "admin_invite", role: "student" },
    });
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: "u1", role: "student" }),
      { onConflict: "id" },
    );
  });

  it("returns failed profile_save when profile select errors", async () => {
    mockFind.mockResolvedValue({ userId: "u1", error: null });
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: "db" } });
    const r = await repairAdminInviteWhenEmailExists({
      admin,
      normalizedEmail: "x@y.com",
      password: "secret12",
      userMetadata: {},
      profile: profileBase,
    });
    expect(r).toEqual({ kind: "failed", diagnostic: "profile_save" });
  });
});
