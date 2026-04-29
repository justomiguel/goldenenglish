/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const {
  assertAdminMock,
  verifyUserPasswordMock,
  recordSystemAuditMock,
  sendNoticeEmailMock,
  revalidatePathMock,
  getBrandPublicMock,
  getEmailProviderMock,
  profilesMaybeSingle,
  profilesEq,
  profilesSelect,
  adminFrom,
  getUserByIdMock,
  updateUserByIdMock,
  adminClient,
} = vi.hoisted(() => {
  const profilesMaybeSingle = vi.fn();
  const profilesEq = vi.fn(() => ({ maybeSingle: profilesMaybeSingle }));
  const profilesSelect = vi.fn(() => ({ eq: profilesEq }));
  const adminFrom = vi.fn(() => ({ select: profilesSelect }));
  const getUserByIdMock = vi.fn();
  const updateUserByIdMock = vi.fn();
  return {
    assertAdminMock: vi.fn(),
    verifyUserPasswordMock: vi.fn(),
    recordSystemAuditMock: vi.fn(),
    sendNoticeEmailMock: vi.fn(),
    revalidatePathMock: vi.fn(),
    getBrandPublicMock: vi.fn(() => ({
      name: "Golden English",
      contactEmail: "info@example.com",
    })),
    getEmailProviderMock: vi.fn(() => ({ sendEmail: vi.fn() })),
    profilesMaybeSingle,
    profilesEq,
    profilesSelect,
    adminFrom,
    getUserByIdMock,
    updateUserByIdMock,
    adminClient: {
      from: adminFrom,
      auth: {
        admin: {
          getUserById: getUserByIdMock,
          updateUserById: updateUserByIdMock,
        },
      },
    },
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: (...a: unknown[]) => revalidatePathMock(...a),
}));

vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => assertAdminMock(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => adminClient,
}));

vi.mock("@/lib/supabase/verifyUserPassword", () => ({
  verifyUserPassword: (...a: unknown[]) => verifyUserPasswordMock(...a),
}));

vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: (...a: unknown[]) => recordSystemAuditMock(...a),
}));

vi.mock("@/lib/email/sendAdminPasswordResetNoticeEmail", () => ({
  sendAdminPasswordResetNoticeEmail: (...a: unknown[]) => sendNoticeEmailMock(...a),
}));

vi.mock("@/lib/email/getEmailProvider", () => ({
  getEmailProvider: () => getEmailProviderMock(),
}));

vi.mock("@/lib/brand/server", () => ({
  getBrandPublic: () => getBrandPublicMock(),
}));

const TARGET = "11111111-2222-4333-8444-555555555555";
const ADMIN = "99999999-8888-4777-8666-555555555555";
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "admin-password-123";

function makePayload(overrides: Record<string, unknown> = {}) {
  return {
    locale: "es",
    targetUserId: TARGET,
    adminPassword: ADMIN_PASSWORD,
    confirmed: true,
    ...overrides,
  };
}

describe("resetUserPasswordByDniAction", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    assertAdminMock.mockReset();
    verifyUserPasswordMock.mockReset();
    recordSystemAuditMock.mockReset();
    sendNoticeEmailMock.mockReset();
    revalidatePathMock.mockReset();
    profilesMaybeSingle.mockReset();
    profilesEq.mockClear();
    profilesSelect.mockClear();
    adminFrom.mockClear();
    getUserByIdMock.mockReset();
    updateUserByIdMock.mockReset();
    getBrandPublicMock.mockClear();
    getEmailProviderMock.mockClear();

    assertAdminMock.mockResolvedValue({
      user: { id: ADMIN, email: ADMIN_EMAIL },
    });
    verifyUserPasswordMock.mockResolvedValue(true);
    profilesMaybeSingle.mockResolvedValue({
      data: { dni_or_passport: "12345678", role: "student" },
      error: null,
    });
    getUserByIdMock.mockResolvedValue({
      data: {
        user: {
          id: TARGET,
          email: "real@example.com",
          app_metadata: { provider: "email" },
        },
      },
      error: null,
    });
    updateUserByIdMock.mockResolvedValue({ data: {}, error: null });
    sendNoticeEmailMock.mockResolvedValue({ ok: true });
    recordSystemAuditMock.mockResolvedValue({ ok: true });

    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleInfoSpy.mockRestore();
  });

  it("rejects an invalid payload without touching downstream services", async () => {
    const { resetUserPasswordByDniAction } = await import(
      "@/app/[locale]/dashboard/admin/users/adminUserDetailCredentialActions"
    );
    const r = await resetUserPasswordByDniAction({
      locale: "es",
      targetUserId: "not-a-uuid",
      adminPassword: ADMIN_PASSWORD,
      confirmed: true,
    });
    expect(r.ok).toBe(false);
    expect(assertAdminMock).not.toHaveBeenCalled();
    expect(verifyUserPasswordMock).not.toHaveBeenCalled();
    expect(updateUserByIdMock).not.toHaveBeenCalled();
  });

  it("returns forbidden when the caller is not admin", async () => {
    assertAdminMock.mockRejectedValue(new Error("admin_session_forbidden"));
    const { resetUserPasswordByDniAction } = await import(
      "@/app/[locale]/dashboard/admin/users/adminUserDetailCredentialActions"
    );
    const r = await resetUserPasswordByDniAction(makePayload());
    expect(r.ok).toBe(false);
    expect(verifyUserPasswordMock).not.toHaveBeenCalled();
  });

  it("rejects when step-up admin password verification fails", async () => {
    verifyUserPasswordMock.mockResolvedValue(false);
    const { resetUserPasswordByDniAction } = await import(
      "@/app/[locale]/dashboard/admin/users/adminUserDetailCredentialActions"
    );
    const r = await resetUserPasswordByDniAction(makePayload());
    expect(r.ok).toBe(false);
    expect(verifyUserPasswordMock).toHaveBeenCalledWith(
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
    );
    expect(updateUserByIdMock).not.toHaveBeenCalled();
  });

  it("rejects when the target profile has no DNI", async () => {
    profilesMaybeSingle.mockResolvedValue({
      data: { dni_or_passport: "  ", role: "student" },
      error: null,
    });
    const { resetUserPasswordByDniAction } = await import(
      "@/app/[locale]/dashboard/admin/users/adminUserDetailCredentialActions"
    );
    const r = await resetUserPasswordByDniAction(makePayload());
    expect(r.ok).toBe(false);
    expect(updateUserByIdMock).not.toHaveBeenCalled();
  });

  it("returns save error when admin.updateUserById fails", async () => {
    updateUserByIdMock.mockResolvedValue({
      data: null,
      error: { message: "kaboom" },
    });
    const { resetUserPasswordByDniAction } = await import(
      "@/app/[locale]/dashboard/admin/users/adminUserDetailCredentialActions"
    );
    const r = await resetUserPasswordByDniAction(makePayload());
    expect(r.ok).toBe(false);
    expect(sendNoticeEmailMock).not.toHaveBeenCalled();
    expect(recordSystemAuditMock).not.toHaveBeenCalled();
  });

  it("happy path with real email: updates password + must_change_password flag, notifies, audits, returns password", async () => {
    const { resetUserPasswordByDniAction } = await import(
      "@/app/[locale]/dashboard/admin/users/adminUserDetailCredentialActions"
    );
    const r = await resetUserPasswordByDniAction(makePayload());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.password).toBe("12345678");
    expect(r.hasRealEmail).toBe(true);

    expect(updateUserByIdMock).toHaveBeenCalledTimes(1);
    const updateCall = updateUserByIdMock.mock.calls[0];
    expect(updateCall[0]).toBe(TARGET);
    expect(updateCall[1]).toEqual(
      expect.objectContaining({
        password: "12345678",
        app_metadata: expect.objectContaining({
          provider: "email",
          must_change_password: true,
        }),
      }),
    );

    expect(sendNoticeEmailMock).toHaveBeenCalledTimes(1);
    expect(sendNoticeEmailMock.mock.calls[0][0]).toEqual(
      expect.objectContaining({ to: "real@example.com", locale: "es" }),
    );

    expect(recordSystemAuditMock).toHaveBeenCalledTimes(1);
    expect(recordSystemAuditMock.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        action: expect.stringContaining("password_reset_by_dni"),
        resourceType: expect.any(String),
        resourceId: TARGET,
      }),
    );
  });

  it("synthetic email: does NOT send notice and reports hasRealEmail=false", async () => {
    getUserByIdMock.mockResolvedValue({
      data: {
        user: {
          id: TARGET,
          email: "12345678@students.goldenenglish.local",
          app_metadata: {},
        },
      },
      error: null,
    });
    const { resetUserPasswordByDniAction } = await import(
      "@/app/[locale]/dashboard/admin/users/adminUserDetailCredentialActions"
    );
    const r = await resetUserPasswordByDniAction(makePayload());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.hasRealEmail).toBe(false);
    expect(sendNoticeEmailMock).not.toHaveBeenCalled();

    expect(recordSystemAuditMock).toHaveBeenCalledTimes(1);
    const auditPayload = recordSystemAuditMock.mock.calls[0][0].payload;
    expect(auditPayload).toEqual(
      expect.objectContaining({ hasRealEmail: false }),
    );
  });

  it("never includes the generated password in the audit payload or logs", async () => {
    const { resetUserPasswordByDniAction } = await import(
      "@/app/[locale]/dashboard/admin/users/adminUserDetailCredentialActions"
    );
    await resetUserPasswordByDniAction(makePayload());

    const auditCall = recordSystemAuditMock.mock.calls[0][0];
    expect(JSON.stringify(auditCall)).not.toContain("12345678");

    const allLogs = [
      ...consoleErrorSpy.mock.calls,
      ...consoleWarnSpy.mock.calls,
      ...consoleInfoSpy.mock.calls,
    ]
      .flat()
      .map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)))
      .join("\n");
    expect(allLogs).not.toContain("12345678");
  });

  it("merges app_metadata: existing keys are preserved", async () => {
    getUserByIdMock.mockResolvedValue({
      data: {
        user: {
          id: TARGET,
          email: "real@example.com",
          app_metadata: { provider: "email", role_hint: "student" },
        },
      },
      error: null,
    });
    const { resetUserPasswordByDniAction } = await import(
      "@/app/[locale]/dashboard/admin/users/adminUserDetailCredentialActions"
    );
    await resetUserPasswordByDniAction(makePayload());
    const update = updateUserByIdMock.mock.calls[0][1];
    expect(update.app_metadata).toEqual({
      provider: "email",
      role_hint: "student",
      must_change_password: true,
    });
  });
});
