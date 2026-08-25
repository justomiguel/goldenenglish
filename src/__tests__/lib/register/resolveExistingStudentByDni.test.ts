/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveExistingStudentByDni } from "@/lib/register/resolveExistingStudentByDni";

function adminMock(opts: {
  rows?: { id: string; role: string; dni_or_passport: string }[];
  profileError?: { message: string } | null;
  authEmail?: string | null;
}) {
  const or = vi.fn().mockReturnValue({
    limit: vi.fn().mockResolvedValue({
      data: opts.rows ?? [],
      error: opts.profileError ?? null,
    }),
  });
  const select = vi.fn().mockReturnValue({ or });
  const from = vi.fn().mockReturnValue({ select });
  const getUserById = vi.fn().mockResolvedValue({
    data: opts.authEmail
      ? { user: { email: opts.authEmail } }
      : { user: { email: "fallback@students.test" } },
    error: null,
  });
  const admin = {
    from,
    auth: { admin: { getUserById } },
  } as unknown as SupabaseClient;
  return { admin, from, getUserById };
}

describe("resolveExistingStudentByDni", () => {
  it("returns none when no profile matches", async () => {
    const { admin } = adminMock({ rows: [] });
    expect(await resolveExistingStudentByDni(admin, "999")).toEqual({ kind: "none" });
  });

  it("returns occupied when the document belongs to a non-student", async () => {
    const { admin, getUserById } = adminMock({
      rows: [{ id: "p1", role: "parent", dni_or_passport: "22334455" }],
    });
    expect(await resolveExistingStudentByDni(admin, "22334455")).toEqual({
      kind: "occupied",
    });
    expect(getUserById).not.toHaveBeenCalled();
  });

  it("returns the student id and auth email", async () => {
    const { admin, getUserById } = adminMock({
      rows: [{ id: "s1", role: "student", dni_or_passport: "12.345.678" }],
      authEmail: "ana@institute.test",
    });
    expect(await resolveExistingStudentByDni(admin, "12345678")).toEqual({
      kind: "student",
      studentId: "s1",
      email: "ana@institute.test",
    });
    expect(getUserById).toHaveBeenCalledWith("s1");
  });
});
