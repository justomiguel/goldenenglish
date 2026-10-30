import { beforeEach, describe, expect, it, vi } from "vitest";

const { signOutMock, revalidateMock, configuredMock, staffMock, cookieMock } = vi.hoisted(() => ({
  signOutMock: vi.fn(),
  revalidateMock: vi.fn(),
  configuredMock: vi.fn(() => true),
  staffMock: vi.fn(),
  cookieMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidateMock(...args),
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerActionException: vi.fn(),
  logServerInfo: vi.fn(),
}));

vi.mock("@/lib/pulsar/pulsarStaffAuth", () => ({
  getPulsarStaffSession: () => staffMock(),
  getPulsarCookieSession: () => cookieMock(),
}));

vi.mock("@/lib/supabase/pulsar", () => ({
  isPulsarSupabaseConfigured: () => configuredMock(),
  createPulsarServerClient: async () => ({
    auth: { signOut: () => signOutMock() },
  }),
}));

import {
  resolvePulsarPostLoginPath,
  signOutPulsarSessionAction,
} from "@/app/[locale]/admin/sessionActions";

describe("signOutPulsarSessionAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configuredMock.mockReturnValue(true);
    signOutMock.mockResolvedValue({ error: null });
  });

  it("clears the Pulsar session and the public, admin, and account paths", async () => {
    const result = await signOutPulsarSessionAction("es");
    expect(result).toEqual({ ok: true });
    expect(signOutMock).toHaveBeenCalledOnce();
    expect(revalidateMock).toHaveBeenCalledWith("/es");
    expect(revalidateMock).toHaveBeenCalledWith("/es/admin");
    expect(revalidateMock).toHaveBeenCalledWith("/es/cuenta");
  });

  it("skips auth when Pulsar is unset", async () => {
    configuredMock.mockReturnValue(false);
    const result = await signOutPulsarSessionAction("es");
    expect(result.ok).toBe(true);
    expect(signOutMock).not.toHaveBeenCalled();
  });
});

describe("resolvePulsarPostLoginPath", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    staffMock.mockResolvedValue(null);
    cookieMock.mockResolvedValue(null);
  });

  it("sends staff to the fleet, or the password screen when required", async () => {
    staffMock.mockResolvedValue({ mustChangePassword: false });
    expect(await resolvePulsarPostLoginPath("es", null)).toBe("/es/admin");
    staffMock.mockResolvedValue({ mustChangePassword: true });
    expect(await resolvePulsarPostLoginPath("es", "/es/cuenta")).toBe("/es/admin/password");
  });

  it("keeps a safe next path for a signed-in owner", async () => {
    cookieMock.mockResolvedValue({ email: "owner@school.test" });
    expect(await resolvePulsarPostLoginPath("es", "/es/admin/tenants/nago/theme")).toBe(
      "/es/admin/tenants/nago/theme",
    );
    expect(await resolvePulsarPostLoginPath("es", "https://evil.test")).toBe("/es/cuenta");
  });

  it("sends a stranger back to login", async () => {
    expect(await resolvePulsarPostLoginPath("es", "/es/admin")).toBe("/es/cuenta/login");
  });
});
