import { beforeEach, describe, expect, it, vi } from "vitest";

const { sessionMock, updateUserMock, flagEqMock } = vi.hoisted(() => ({
  sessionMock: vi.fn(),
  updateUserMock: vi.fn(),
  flagEqMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/pulsar/pulsarStaffAuth", () => ({
  getPulsarStaffSession: () => sessionMock(),
}));
vi.mock("@/lib/supabase/pulsar", () => ({
  createPulsarAdminClient: () => ({
    auth: { admin: { updateUserById: updateUserMock } },
    from: () => ({
      update: () => ({ eq: flagEqMock }),
    }),
  }),
}));

import { changePulsarStaffPasswordAction } from "@/app/[locale]/admin/passwordActions";

describe("changePulsarStaffPasswordAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionMock.mockResolvedValue({
      userId: "u-1",
      email: "staff@pulsarlab.cl",
      mode: "pulsar-db",
      mustChangePassword: true,
    });
    updateUserMock.mockResolvedValue({ error: null });
    flagEqMock.mockResolvedValue({ error: null });
  });

  it("rejects a password shorter than 8 characters", async () => {
    const result = await changePulsarStaffPasswordAction({ locale: "es", password: "short" });
    expect(result).toEqual({ ok: false, errorCode: "too_short" });
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("sets the new password and clears the temporary flag", async () => {
    const result = await changePulsarStaffPasswordAction({
      locale: "es",
      password: "a-new-secret",
    });
    expect(result).toEqual({ ok: true });
    expect(updateUserMock).toHaveBeenCalledWith("u-1", { password: "a-new-secret" });
    expect(flagEqMock).toHaveBeenCalledWith("user_id", "u-1");
  });

  it("does nothing when the password is already permanent", async () => {
    sessionMock.mockResolvedValue({
      userId: "u-1",
      email: "staff@pulsarlab.cl",
      mode: "pulsar-db",
      mustChangePassword: false,
    });
    const result = await changePulsarStaffPasswordAction({
      locale: "es",
      password: "a-new-secret",
    });
    expect(result).toEqual({ ok: false, errorCode: "not_required" });
    expect(updateUserMock).not.toHaveBeenCalled();
  });
});
