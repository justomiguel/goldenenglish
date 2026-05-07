import { describe, it, expect, vi, beforeEach } from "vitest";
import es from "@/dictionaries/es.json";
import { createDashboardUser } from "@/app/[locale]/dashboard/admin/users/actions";
import { ADMIN_INVITE_DEFAULT_PASSWORD } from "@/lib/dashboard/adminInviteDefaultPassword";

const U = es.admin.users;

const mockAssertAdmin = vi.fn();
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

const mockCreateUser = vi.fn();
const mockListUsers = vi.fn();
const mockUpdateUserById = vi.fn();
const mockProfilesUpsert = vi.fn().mockResolvedValue({ error: null });
const mockProfilesMaybeSingle = vi.fn().mockResolvedValue({
  data: { id: "existing" },
  error: null,
});

const mockAdminClient = {
  auth: {
    admin: {
      createUser: (...args: unknown[]) => mockCreateUser(...args),
      listUsers: (...args: unknown[]) => mockListUsers(...args),
      updateUserById: (...args: unknown[]) => mockUpdateUserById(...args),
    },
  },
  from: vi.fn((table: string) => {
    if (table === "profiles") {
      return {
        upsert: mockProfilesUpsert,
        select: () => ({
          eq: () => ({ maybeSingle: mockProfilesMaybeSingle }),
        }),
      };
    }
    throw new Error(`unexpected table ${table}`);
  }),
};

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdminClient,
}));

const adminCtx = {
  user: { id: "11111111-1111-1111-1111-111111111111" },
  supabase: {},
};

const validPayload = {
  email: "u@test.com",
  password: "secret12",
  role: "student" as const,
  first_name: "A",
  last_name: "B",
  dni_or_passport: "1",
  phone: "+100000",
};

describe("createDashboardUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfilesUpsert.mockResolvedValue({ error: null });
    mockProfilesMaybeSingle.mockResolvedValue({
      data: { id: "existing" },
      error: null,
    });
    mockListUsers.mockResolvedValue({
      data: { users: [{ id: "orphan", email: "u@test.com" }] },
      error: null,
    });
    mockUpdateUserById.mockResolvedValue({ data: { user: {} }, error: null });
  });

  it("returns Forbidden when not admin", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("no"));
    const r = await createDashboardUser(validPayload);
    expect(r).toEqual({ ok: false, message: U.errCreateForbidden });
  });

  it("returns a field hint when schema fails email", async () => {
    mockAssertAdmin.mockResolvedValue(adminCtx);
    const r = await createDashboardUser({
      ...validPayload,
      email: "not-an-email",
      locale: "es",
    });
    expect(r).toEqual({ ok: false, message: U.errCreateInvalidEmail });
  });

  it("returns auth_failed when createUser errors", async () => {
    mockAssertAdmin.mockResolvedValue(adminCtx);
    mockCreateUser.mockResolvedValue({
      data: { user: null },
      error: { message: "upstream failure", code: "unknown" },
    });
    const r = await createDashboardUser(validPayload);
    expect(r).toEqual({ ok: false, message: U.errCreateAuth });
  });

  it("returns email_exists when auth reports duplicate and profile already exists", async () => {
    mockAssertAdmin.mockResolvedValue(adminCtx);
    mockCreateUser.mockResolvedValue({
      data: { user: null },
      error: { message: "User already registered" },
    });
    mockProfilesMaybeSingle.mockResolvedValue({
      data: { id: "same-user" },
      error: null,
    });
    const r = await createDashboardUser(validPayload);
    expect(r).toEqual({ ok: false, message: U.errCreateEmailExists });
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });

  it("repairs orphan auth user when email exists but profile row is missing", async () => {
    mockAssertAdmin.mockResolvedValue(adminCtx);
    mockCreateUser.mockResolvedValue({
      data: { user: null },
      error: { message: "User already registered" },
    });
    mockProfilesMaybeSingle.mockResolvedValue({ data: null, error: null });
    const r = await createDashboardUser(validPayload);
    expect(r).toEqual({ ok: true, userId: "orphan" });
    expect(mockUpdateUserById).toHaveBeenCalledWith(
      "orphan",
      expect.objectContaining({
        password: validPayload.password,
        email_confirm: true,
      }),
    );
    expect(mockProfilesUpsert).toHaveBeenCalled();
  });

  it("returns profile_save_failed when profiles upsert fails", async () => {
    mockAssertAdmin.mockResolvedValue(adminCtx);
    mockCreateUser.mockResolvedValue({
      data: { user: { id: "x" } },
      error: null,
    });
    mockProfilesUpsert.mockResolvedValue({
      error: { message: "rls denied", code: "42501" },
    });
    const r = await createDashboardUser(validPayload);
    expect(r).toEqual({ ok: false, message: U.errCreateProfileSave });
  });

  it("returns no_user_returned when API omits user", async () => {
    mockAssertAdmin.mockResolvedValue(adminCtx);
    mockCreateUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    const r = await createDashboardUser(validPayload);
    expect(r).toEqual({ ok: false, message: U.errCreateNoUser });
  });

  it("returns ok on success", async () => {
    mockAssertAdmin.mockResolvedValue(adminCtx);
    mockCreateUser.mockResolvedValue({
      data: { user: { id: "x" } },
      error: null,
    });
    const r = await createDashboardUser(validPayload);
    expect(r).toEqual({ ok: true, userId: "x" });
  });

  it("passes optional birth_date in user_metadata", async () => {
    mockAssertAdmin.mockResolvedValue(adminCtx);
    mockCreateUser.mockResolvedValue({
      data: { user: { id: "x" } },
      error: null,
    });
    const r = await createDashboardUser({
      ...validPayload,
      birth_date: "2012-01-15",
    });
    expect(r).toEqual({ ok: true, userId: "x" });
    const call = mockCreateUser.mock.calls[0][0] as {
      user_metadata: Record<string, string>;
    };
    expect(call.user_metadata.birth_date).toBe("2012-01-15");
  });

  it("omits blank dni_or_passport / phone from user_metadata", async () => {
    mockAssertAdmin.mockResolvedValue(adminCtx);
    mockCreateUser.mockResolvedValue({
      data: { user: { id: "x" } },
      error: null,
    });
    const r = await createDashboardUser({
      email: "gen@test.com",
      password: "secret12",
      first_name: "A",
      last_name: "B",
      dni_or_passport: "  ",
      phone: "",
    });
    expect(r.ok).toBe(true);
    const call = mockCreateUser.mock.calls[0][0] as {
      user_metadata: Record<string, string>;
    };
    expect(call.user_metadata.dni_or_passport).toBeUndefined();
    expect(call.user_metadata.phone).toBeUndefined();
    expect(mockProfilesUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ dni_or_passport: null, phone: null }),
      expect.any(Object),
    );
  });

  it("uses institute default password when empty and succeeds", async () => {
    mockAssertAdmin.mockResolvedValue(adminCtx);
    mockCreateUser.mockResolvedValue({
      data: { user: { id: "x" } },
      error: null,
    });
    const r = await createDashboardUser({
      email: "gen@test.com",
      password: "",
      first_name: "A",
      last_name: "B",
      dni_or_passport: "2",
      phone: "+1999",
    });
    expect(r).toEqual({ ok: true, userId: "x" });
    const call = mockCreateUser.mock.calls[0][0] as { password: string };
    expect(call.password).toBe(ADMIN_INVITE_DEFAULT_PASSWORD);
  });

  it("rejects short non-empty password", async () => {
    mockAssertAdmin.mockResolvedValue(adminCtx);
    const r = await createDashboardUser({
      ...validPayload,
      password: "12345",
      locale: "es",
    });
    expect(r).toEqual({ ok: false, message: U.errCreatePassword });
  });
});
