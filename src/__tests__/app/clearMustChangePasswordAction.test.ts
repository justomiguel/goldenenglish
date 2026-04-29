/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const {
  getUserMock,
  serverGetUserMock,
  getUserByIdMock,
  updateUserByIdMock,
} = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  serverGetUserMock: vi.fn(),
  getUserByIdMock: vi.fn(),
  updateUserByIdMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: () => serverGetUserMock() },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        getUserById: getUserByIdMock,
        updateUserById: updateUserByIdMock,
      },
    },
  }),
}));

const SELF = "11111111-2222-4333-8444-555555555555";

describe("clearMustChangePasswordFlagAction", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    serverGetUserMock.mockReset();
    getUserByIdMock.mockReset();
    updateUserByIdMock.mockReset();
    getUserMock.mockReset();

    serverGetUserMock.mockResolvedValue({
      data: { user: { id: SELF } },
      error: null,
    });
    getUserByIdMock.mockResolvedValue({
      data: {
        user: {
          id: SELF,
          app_metadata: {
            provider: "email",
            must_change_password: true,
            role_hint: "student",
          },
        },
      },
      error: null,
    });
    updateUserByIdMock.mockResolvedValue({ data: {}, error: null });
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns ok=false when no session is present", async () => {
    serverGetUserMock.mockResolvedValue({ data: { user: null }, error: null });
    const { clearMustChangePasswordFlagAction } = await import(
      "@/app/[locale]/reset-password/clearMustChangePasswordAction"
    );
    const r = await clearMustChangePasswordFlagAction();
    expect(r.ok).toBe(false);
    expect(updateUserByIdMock).not.toHaveBeenCalled();
  });

  it("clears the flag while preserving other app_metadata keys", async () => {
    const { clearMustChangePasswordFlagAction } = await import(
      "@/app/[locale]/reset-password/clearMustChangePasswordAction"
    );
    const r = await clearMustChangePasswordFlagAction();
    expect(r.ok).toBe(true);
    expect(updateUserByIdMock).toHaveBeenCalledTimes(1);
    expect(updateUserByIdMock.mock.calls[0][0]).toBe(SELF);
    expect(updateUserByIdMock.mock.calls[0][1]).toEqual({
      app_metadata: {
        provider: "email",
        must_change_password: false,
        role_hint: "student",
      },
    });
  });

  it("returns ok=false when updateUserById errors", async () => {
    updateUserByIdMock.mockResolvedValue({
      data: null,
      error: { message: "boom" },
    });
    const { clearMustChangePasswordFlagAction } = await import(
      "@/app/[locale]/reset-password/clearMustChangePasswordAction"
    );
    const r = await clearMustChangePasswordFlagAction();
    expect(r.ok).toBe(false);
  });

  it("returns ok=false when getUserById errors but does not throw", async () => {
    getUserByIdMock.mockResolvedValue({
      data: null,
      error: { message: "kaput" },
    });
    const { clearMustChangePasswordFlagAction } = await import(
      "@/app/[locale]/reset-password/clearMustChangePasswordAction"
    );
    const r = await clearMustChangePasswordFlagAction();
    expect(r.ok).toBe(false);
    expect(updateUserByIdMock).not.toHaveBeenCalled();
  });

  it("treats a missing app_metadata as an empty object", async () => {
    getUserByIdMock.mockResolvedValue({
      data: { user: { id: SELF, app_metadata: undefined } },
      error: null,
    });
    const { clearMustChangePasswordFlagAction } = await import(
      "@/app/[locale]/reset-password/clearMustChangePasswordAction"
    );
    const r = await clearMustChangePasswordFlagAction();
    expect(r.ok).toBe(true);
    expect(updateUserByIdMock.mock.calls[0][1].app_metadata).toEqual({
      must_change_password: false,
    });
  });
});
