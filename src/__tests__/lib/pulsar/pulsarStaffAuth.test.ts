import { beforeEach, describe, expect, it, vi } from "vitest";

const { isConfiguredMock, getUserMock, maybeSingleMock } = vi.hoisted(() => ({
  isConfiguredMock: vi.fn(() => true),
  getUserMock: vi.fn(),
  maybeSingleMock: vi.fn(),
}));

vi.mock("@/lib/supabase/pulsar", () => ({
  isPulsarSupabaseConfigured: () => isConfiguredMock(),
  createPulsarServerClient: async () => ({
    auth: {
      getUser: () => getUserMock(),
    },
  }),
  createPulsarAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => maybeSingleMock(),
        }),
      }),
    }),
  }),
}));

import {
  assertPulsarStaffSession,
  getPulsarCookieSession,
  getPulsarStaffSession,
  pulsarStaffHomePath,
} from "@/lib/pulsar/pulsarStaffAuth";

describe("pulsarStaffAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isConfiguredMock.mockReturnValue(true);
  });

  it("allows an authenticated user present in platform_staff", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u-1", email: "staff@pulsarlab.cl" } },
      error: null,
    });
    maybeSingleMock.mockResolvedValue({
      data: { user_id: "u-1", email: "staff@pulsarlab.cl", must_change_password: true },
      error: null,
    });

    const session = await getPulsarStaffSession();
    expect(session).toEqual({
      userId: "u-1",
      email: "staff@pulsarlab.cl",
      mode: "pulsar-db",
      mustChangePassword: true,
    });
    expect(session && pulsarStaffHomePath("es", session)).toBe("/es/admin/password");
  });

  it("denies an authenticated user who is not in platform_staff", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u-2", email: "intruder@example.com" } },
      error: null,
    });
    maybeSingleMock.mockResolvedValue({
      data: null,
      error: null,
    });

    const session = await getPulsarStaffSession();
    expect(session).toBeNull();
    await expect(assertPulsarStaffSession()).rejects.toThrow("pulsar_staff_unauthorized");
  });

  it("opens the fleet when the password is no longer temporary", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u-1", email: null } },
      error: null,
    });
    maybeSingleMock.mockResolvedValue({
      data: { user_id: "u-1", email: "staff@pulsarlab.cl", must_change_password: false },
      error: null,
    });
    const session = await getPulsarStaffSession();
    expect(session?.email).toBe("staff@pulsarlab.cl");
    expect(session?.mustChangePassword).toBe(false);
    expect(session && pulsarStaffHomePath("es", session)).toBe("/es/admin");
    await expect(assertPulsarStaffSession()).resolves.toMatchObject({ userId: "u-1" });
  });

  it("returns null when Pulsar is unset, auth fails, or the staff query throws", async () => {
    isConfiguredMock.mockReturnValue(false);
    expect(await getPulsarStaffSession()).toBeNull();

    isConfiguredMock.mockReturnValue(true);
    getUserMock.mockResolvedValue({ data: { user: null }, error: { message: "no session" } });
    expect(await getPulsarStaffSession()).toBeNull();

    getUserMock.mockResolvedValue({
      data: { user: { id: "u-1", email: "staff@pulsarlab.cl" } },
      error: null,
    });
    maybeSingleMock.mockResolvedValue({ data: null, error: { message: "db down" } });
    expect(await getPulsarStaffSession()).toBeNull();

    getUserMock.mockRejectedValue(new Error("cookies"));
    expect(await getPulsarStaffSession()).toBeNull();
  });

  it("reads a cookie email and skips the local staff bypass", async () => {
    isConfiguredMock.mockReturnValue(false);
    expect(await getPulsarCookieSession()).toBeNull();

    isConfiguredMock.mockReturnValue(true);
    getUserMock.mockResolvedValue({
      data: { user: { id: "u-9", email: "owner@school.test" } },
      error: null,
    });
    expect(await getPulsarCookieSession()).toEqual({ email: "owner@school.test" });

    getUserMock.mockResolvedValue({
      data: { user: { id: "u-9", email: null } },
      error: null,
    });
    expect(await getPulsarCookieSession()).toBeNull();
  });
});
