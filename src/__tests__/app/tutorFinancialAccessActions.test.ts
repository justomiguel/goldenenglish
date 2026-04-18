/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { dictEn } from "@/test/dictEn";

const resolveTutorStudentLink = vi.fn();
const recordUserEventServer = vi.fn();
const revalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => revalidatePath(...args),
}));

vi.mock("@/lib/auth/resolveTutorStudentLink", () => ({
  resolveTutorStudentLink: (...args: unknown[]) => resolveTutorStudentLink(...args),
}));

vi.mock("@/lib/analytics/server/recordUserEvent", () => ({
  recordUserEventServer: (...args: unknown[]) => recordUserEventServer(...args),
}));

const supabaseRef: { current: unknown } = { current: null };
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(supabaseRef.current),
}));

interface Spec {
  user?: { id: string } | null;
  profile?: { role: string; is_minor: boolean } | null;
  updateError?: unknown;
}

function buildSupabase(spec: Spec) {
  const updates: Array<Record<string, unknown>> = [];
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: spec.user ?? null } }),
    },
    _updates: updates,
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: spec.profile ?? null,
            error: null,
          }),
        };
      }
      if (table === "tutor_student_rel") {
        return {
          update: vi.fn((payload: Record<string, unknown>) => {
            updates.push(payload);
            return {
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: spec.updateError ?? null }),
              }),
            };
          }),
        };
      }
      throw new Error(`unexpected ${table}`);
    }),
  };
}

function fd(o: Partial<{ tutorId: string; intent: string; locale: string }> = {}) {
  const form = new FormData();
  form.set("locale", o.locale ?? "en");
  form.set("tutorId", o.tutorId ?? "tutor-1");
  form.set("intent", o.intent ?? "revoke");
  return form;
}

const messages = dictEn.actionErrors.tutorFinancialAccess;

beforeEach(() => {
  vi.clearAllMocks();
  supabaseRef.current = null;
});

describe("setTutorFinancialAccess", () => {
  it("rejects invalid intent", async () => {
    const { setTutorFinancialAccess } = await import(
      "@/app/[locale]/dashboard/profile/tutorFinancialAccessActions"
    );
    const result = await setTutorFinancialAccess(fd({ intent: "delete" }));
    expect(result).toEqual({ ok: false, message: messages.invalidForm });
  });

  it("rejects unauthenticated callers", async () => {
    supabaseRef.current = buildSupabase({ user: null });
    const { setTutorFinancialAccess } = await import(
      "@/app/[locale]/dashboard/profile/tutorFinancialAccessActions"
    );
    expect(await setTutorFinancialAccess(fd())).toEqual({
      ok: false,
      message: messages.unauthorized,
    });
  });

  it("forbids non-student profiles", async () => {
    supabaseRef.current = buildSupabase({
      user: { id: "u-1" },
      profile: { role: "parent", is_minor: false },
    });
    const { setTutorFinancialAccess } = await import(
      "@/app/[locale]/dashboard/profile/tutorFinancialAccessActions"
    );
    expect(await setTutorFinancialAccess(fd())).toEqual({
      ok: false,
      message: messages.forbidden,
    });
  });

  it("blocks minors from toggling tutor access", async () => {
    supabaseRef.current = buildSupabase({
      user: { id: "u-1" },
      profile: { role: "student", is_minor: true },
    });
    const { setTutorFinancialAccess } = await import(
      "@/app/[locale]/dashboard/profile/tutorFinancialAccessActions"
    );
    expect(await setTutorFinancialAccess(fd())).toEqual({
      ok: false,
      message: messages.minorCannotChange,
    });
  });

  it("returns linkNotFound when no tutor_student_rel row exists", async () => {
    supabaseRef.current = buildSupabase({
      user: { id: "u-1" },
      profile: { role: "student", is_minor: false },
    });
    resolveTutorStudentLink.mockResolvedValue({
      linked: false,
      financialAccessActive: false,
    });
    const { setTutorFinancialAccess } = await import(
      "@/app/[locale]/dashboard/profile/tutorFinancialAccessActions"
    );
    expect(await setTutorFinancialAccess(fd())).toEqual({
      ok: false,
      message: messages.linkNotFound,
    });
  });

  it("revokes by setting both financial_access columns and records analytics", async () => {
    const supabase = buildSupabase({
      user: { id: "stu-1" },
      profile: { role: "student", is_minor: false },
    });
    supabaseRef.current = supabase;
    resolveTutorStudentLink.mockResolvedValue({
      linked: true,
      financialAccessActive: true,
    });

    const { setTutorFinancialAccess } = await import(
      "@/app/[locale]/dashboard/profile/tutorFinancialAccessActions"
    );
    const result = await setTutorFinancialAccess(
      fd({ intent: "revoke", tutorId: "tutor-9" }),
    );
    expect(result).toEqual({ ok: true });
    const updates = (supabase as unknown as { _updates: Array<Record<string, unknown>> })
      ._updates;
    expect(updates).toHaveLength(1);
    expect(updates[0].financial_access_revoked_by).toBe("stu-1");
    expect(typeof updates[0].financial_access_revoked_at).toBe("string");
    expect(recordUserEventServer).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "stu-1",
        entity: expect.stringContaining("revoked"),
        metadata: { tutor_id: "tutor-9" },
      }),
    );
  });

  it("restores by clearing both financial_access columns", async () => {
    const supabase = buildSupabase({
      user: { id: "stu-1" },
      profile: { role: "student", is_minor: false },
    });
    supabaseRef.current = supabase;
    resolveTutorStudentLink.mockResolvedValue({
      linked: true,
      financialAccessActive: false,
    });

    const { setTutorFinancialAccess } = await import(
      "@/app/[locale]/dashboard/profile/tutorFinancialAccessActions"
    );
    const result = await setTutorFinancialAccess(
      fd({ intent: "restore", tutorId: "tutor-9" }),
    );
    expect(result).toEqual({ ok: true });
    const updates = (supabase as unknown as { _updates: Array<Record<string, unknown>> })
      ._updates;
    expect(updates[0]).toEqual({
      financial_access_revoked_at: null,
      financial_access_revoked_by: null,
    });
    expect(recordUserEventServer).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "stu-1",
        entity: expect.stringContaining("restored"),
        metadata: { tutor_id: "tutor-9" },
      }),
    );
  });

  it("surfaces updateFailed when Supabase returns an error", async () => {
    supabaseRef.current = buildSupabase({
      user: { id: "stu-1" },
      profile: { role: "student", is_minor: false },
      updateError: { message: "boom" },
    });
    resolveTutorStudentLink.mockResolvedValue({
      linked: true,
      financialAccessActive: true,
    });
    const { setTutorFinancialAccess } = await import(
      "@/app/[locale]/dashboard/profile/tutorFinancialAccessActions"
    );
    expect(await setTutorFinancialAccess(fd())).toEqual({
      ok: false,
      message: messages.updateFailed,
    });
  });
});
