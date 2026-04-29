// REGRESSION CHECK: Initial coverage. Critical invariants:
//  - DNI matching a real profile returns that profile's auth.users.email
//    (the *real* email when populated, the *synthetic* one when the user has
//     no real email),
//  - DNI with no matching profile returns a deterministic synthetic address
//    so the endpoint stays opaque and never leaks "user does not exist",
//  - DNI is matched against `lower(trim(dni_or_passport))` in profiles,
//  - errors from profiles / auth.admin do not crash the caller; we still
//    return a synthetic address so the login flow can proceed and fail at
//    Supabase Auth with the standard invalid_credentials message.

/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { lookupEmailByDni } from "@/lib/auth/lookupEmailByDni";

interface ProfileRow {
  id: string;
  role: string;
}

function buildAdminMock(opts: {
  profile?: ProfileRow | null;
  profileError?: { message: string } | null;
  authEmail?: string | null;
  authError?: { message: string } | null;
}) {
  const eq = vi.fn().mockReturnValue({
    maybeSingle: vi.fn().mockResolvedValue({
      data: opts.profile ?? null,
      error: opts.profileError ?? null,
    }),
  });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  const getUserById = vi.fn().mockResolvedValue({
    data: opts.authEmail
      ? { user: { id: opts.profile?.id ?? "x", email: opts.authEmail } }
      : { user: null },
    error: opts.authError ?? null,
  });
  const admin = {
    from,
    auth: { admin: { getUserById } },
  } as unknown as SupabaseClient;
  return { admin, from, select, eq, getUserById };
}

describe("lookupEmailByDni", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the real auth email when the DNI matches a profile", async () => {
    const { admin, from, select, eq, getUserById } = buildAdminMock({
      profile: { id: "user-1", role: "student" },
      authEmail: "real@example.com",
    });

    const email = await lookupEmailByDni(admin, "12345678");

    expect(email).toBe("real@example.com");
    expect(from).toHaveBeenCalledWith("profiles");
    expect(select).toHaveBeenCalledWith("id, role");
    expect(eq).toHaveBeenCalledWith("dni_or_passport", "12345678");
    expect(getUserById).toHaveBeenCalledWith("user-1");
  });

  it("returns the parent synthetic address for parent profiles without auth email", async () => {
    const { admin } = buildAdminMock({
      profile: { id: "user-2", role: "parent" },
      authEmail: null,
    });

    const email = await lookupEmailByDni(admin, "ABC-123");

    expect(email).toBe("abc123@parents.goldenenglish.local");
  });

  it("returns the student synthetic address for student profiles without auth email", async () => {
    const { admin } = buildAdminMock({
      profile: { id: "user-3", role: "student" },
      authEmail: null,
    });

    const email = await lookupEmailByDni(admin, "9999");

    expect(email).toBe("9999@students.goldenenglish.local");
  });

  it("returns a deterministic synthetic address when DNI has no profile (opacity)", async () => {
    const { admin, getUserById } = buildAdminMock({ profile: null });

    const email = await lookupEmailByDni(admin, "00000000");

    expect(email).toBe("00000000@students.goldenenglish.local");
    expect(getUserById).not.toHaveBeenCalled();
  });

  it("returns a synthetic address when profiles query errors out", async () => {
    const { admin } = buildAdminMock({
      profile: null,
      profileError: { message: "boom" },
    });

    const email = await lookupEmailByDni(admin, "11111111");

    expect(email).toBe("11111111@students.goldenenglish.local");
  });

  it("falls back to synthetic when getUserById errors out", async () => {
    const { admin } = buildAdminMock({
      profile: { id: "user-4", role: "student" },
      authEmail: null,
      authError: { message: "auth boom" },
    });

    const email = await lookupEmailByDni(admin, "22");

    expect(email).toBe("22@students.goldenenglish.local");
  });

  it("returns synthetic 'sin-doc' when DNI has no alphanumerics", async () => {
    const { admin } = buildAdminMock({ profile: null });
    const email = await lookupEmailByDni(admin, "---");
    expect(email).toBe("sin-doc@students.goldenenglish.local");
  });
});
