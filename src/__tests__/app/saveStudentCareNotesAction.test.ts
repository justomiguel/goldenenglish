import { describe, it, expect, vi, beforeEach } from "vitest";
import es from "@/dictionaries/es.json";
import { saveStudentCareNotesAction } from "@/app/[locale]/dashboard/admin/users/saveStudentCareNotesAction";

const U = es.admin.users;

// Zod 4 checks the RFC version/variant nibbles, so these have to be real v4s.
const TARGET = "11111111-1111-4111-8111-111111111111";
const ADMIN_ID = "22222222-2222-4222-8222-222222222222";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockAssertAdmin = vi.fn();
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

const mockAudit = vi.fn();
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: (...args: unknown[]) => mockAudit(...args),
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerAuthzDenied: vi.fn(),
  logServerActionException: vi.fn(),
  logSupabaseClientError: vi.fn(),
}));

const mockUpdate = vi.fn();
const mockFrom = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: (...args: unknown[]) => mockFrom(...args) }),
}));

function setProfilesTable(options: { role?: string | null; updateError?: unknown } = {}) {
  const { role = "student", updateError = null } = options;
  mockUpdate.mockReturnValue({ eq: () => Promise.resolve({ error: updateError }) });
  mockFrom.mockImplementation((table: string) => {
    if (table !== "profiles") throw new Error(`unexpected table: ${table}`);
    return {
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({ data: role === null ? null : { id: TARGET, role }, error: null }),
        }),
      }),
      update: (...args: unknown[]) => mockUpdate(...args),
    };
  });
}

function input(overrides: Record<string, unknown> = {}) {
  return {
    locale: "es",
    targetUserId: TARGET,
    healthNote: "Asma leve",
    dietNote: "",
    supportNote: "",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAssertAdmin.mockResolvedValue({ user: { id: ADMIN_ID } });
});

describe("saveStudentCareNotesAction", () => {
  it("refuses a non-admin without writing", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("no"));
    setProfilesTable();

    const result = await saveStudentCareNotesAction(input());

    expect(result).toEqual({ ok: false, message: U.detailErrForbidden });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects a malformed id before touching the database", async () => {
    setProfilesTable();

    const result = await saveStudentCareNotesAction(input({ targetUserId: "nope" }));

    expect(result.ok).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("rejects a note longer than the limit", async () => {
    setProfilesTable();

    const result = await saveStudentCareNotesAction(input({ healthNote: "x".repeat(2001) }));

    expect(result.ok).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("refuses a target who is not a student", async () => {
    setProfilesTable({ role: "teacher" });

    const result = await saveStudentCareNotesAction(input());

    expect(result.ok).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("refuses a target who does not exist", async () => {
    setProfilesTable({ role: null });

    const result = await saveStudentCareNotesAction(input());

    expect(result.ok).toBe(false);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("saves the trimmed notes and stamps who did it", async () => {
    setProfilesTable();

    const result = await saveStudentCareNotesAction(
      input({ healthNote: "  Asma leve  ", supportNote: "Ubicar adelante" }),
    );

    expect(result).toEqual({ ok: true, message: U.detailCareSaved });
    const patch = mockUpdate.mock.calls[0]![0] as Record<string, unknown>;
    expect(patch.care_health_note).toBe("Asma leve");
    expect(patch.care_support_note).toBe("Ubicar adelante");
    expect(patch.care_updated_by).toBe(ADMIN_ID);
    expect(typeof patch.care_updated_at).toBe("string");
    // has_care_notes is the trigger's job; writing it here would let the two drift.
    expect(patch).not.toHaveProperty("has_care_notes");
  });

  it("writes null rather than an empty string when a note is cleared", async () => {
    setProfilesTable();

    await saveStudentCareNotesAction(input({ healthNote: "   ", dietNote: "", supportNote: "" }));

    const patch = mockUpdate.mock.calls[0]![0] as Record<string, unknown>;
    expect(patch.care_health_note).toBeNull();
    expect(patch.care_diet_note).toBeNull();
    expect(patch.care_support_note).toBeNull();
  });

  it("audits which notes changed and never the text itself", async () => {
    setProfilesTable();

    await saveStudentCareNotesAction(
      input({ healthNote: "Asma leve", dietNote: "Sin gluten", supportNote: "" }),
    );

    expect(mockAudit).toHaveBeenCalledTimes(1);
    const entry = mockAudit.mock.calls[0]![0] as {
      action: string;
      resourceType: string;
      resourceId: string;
      payload: Record<string, unknown>;
    };
    expect(entry.action).toBe("student_care_notes_update");
    expect(entry.resourceType).toBe("profiles");
    expect(entry.resourceId).toBe(TARGET);
    expect(entry.payload).toEqual({
      healthPresent: true,
      dietPresent: true,
      supportPresent: false,
    });

    const serialized = JSON.stringify(mockAudit.mock.calls);
    expect(serialized).not.toContain("Asma");
    expect(serialized).not.toContain("gluten");
  });

  it("surfaces a Supabase failure as a saved-nothing error", async () => {
    setProfilesTable({ updateError: { message: "boom" } });

    const result = await saveStudentCareNotesAction(input());

    expect(result).toEqual({ ok: false, message: U.detailErrCareSave });
    expect(mockAudit).not.toHaveBeenCalled();
  });
});
