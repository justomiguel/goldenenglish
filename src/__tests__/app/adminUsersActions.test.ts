import { describe, it, expect, vi, beforeEach } from "vitest";
import es from "@/dictionaries/es.json";
import { createDashboardUser } from "@/app/[locale]/dashboard/admin/users/actions";
import { ADMIN_INVITE_DEFAULT_PASSWORD } from "@/lib/dashboard/adminInviteDefaultPassword";

const U = es.admin.users;

const mockAssertAdmin = vi.fn();
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

vi.mock("@/lib/dashboard/linkGuardianAfterMinorStudentCreate", () => ({
  linkGuardianAfterMinorStudentCreate: vi.fn().mockResolvedValue({ kind: "ok" }),
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
  birth_date: "1990-06-15",
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
      birth_date: "2000-01-15",
    });
    expect(r).toEqual({ ok: true, userId: "x" });
    const call = mockCreateUser.mock.calls[0][0] as {
      user_metadata: Record<string, string>;
    };
    expect(call.user_metadata.birth_date).toBe("2000-01-15");
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
      role: "teacher",
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
      role: "teacher",
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

  it("retries MAIL_TENANT synthetic email with random letter suffix when Auth email is taken", async () => {
    vi.stubEnv("MAIL_TENANT", "alumnos.test");
    mockAssertAdmin.mockResolvedValue(adminCtx);
    mockCreateUser
      .mockResolvedValueOnce({
        data: { user: null },
        error: { message: "User already registered" },
      })
      .mockResolvedValueOnce({
        data: { user: { id: "new-student" } },
        error: null,
      });

    const r = await createDashboardUser({
      email: "",
      password: "",
      first_name: "Ana",
      last_name: "Garcia",
      dni_or_passport: "12345678-9",
      phone: "",
      birth_date: "2018-01-10",
      role: "student",
      locale: "es",
      student_guardian_mode: "new",
      tutor_dni: "98765432-1",
      tutor_first_name: "Luis",
      tutor_last_name: "Garcia",
      tutor_email: "luis@example.com",
      tutor_relationship: "father",
    });
    vi.unstubAllEnvs();

    expect(r).toEqual({ ok: true, userId: "new-student" });
    expect(mockCreateUser).toHaveBeenCalledTimes(2);
    const first = mockCreateUser.mock.calls[0][0] as { email: string };
    const second = mockCreateUser.mock.calls[1][0] as { email: string };
    expect(first.email).toBe("anagarcia-123456789@alumnos.test");
    expect(second.email).not.toBe(first.email);
    expect(second.email.endsWith("@alumnos.test")).toBe(true);
    const extra = second.email.slice(
      "anagarcia".length,
      second.email.indexOf("-123456789@"),
    );
    expect(extra.length).toBeGreaterThanOrEqual(3);
    expect(/^[a-z]+$/.test(extra)).toBe(true);
  });
});
