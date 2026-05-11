// REGRESSION CHECK: Tutor link actions require admin session, student target, guardian tutor
// (parent or admin — admin matches DNI reuse in ensureParentProfileByTutorDni), and audit on success.
import { describe, it, expect, vi, beforeEach } from "vitest";
import es from "@/dictionaries/es.json";
import {
  upsertAdminStudentTutorLinkAction,
  removeAdminStudentTutorLinkAction,
} from "@/app/[locale]/dashboard/admin/users/adminUserDetailTutorActions";
import { createAdminParentAndLinkStudentAction } from "@/app/[locale]/dashboard/admin/users/adminUserDetailTutorCreateActions";

const U = es.admin.users;

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const mockRecordSystemAudit = vi.fn().mockResolvedValue({ ok: true });
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: (...a: unknown[]) => mockRecordSystemAudit(...a),
}));

const mockAssertAdmin = vi.fn();
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

const mockEnsureParent = vi.fn();
const mockUpsertTutorStudentLink = vi.fn();
vi.mock("@/lib/register/ensureParentProfileByTutorDni", () => ({
  ensureParentProfileByTutorDni: (...a: unknown[]) => mockEnsureParent(...a),
  upsertTutorStudentLink: (...a: unknown[]) => mockUpsertTutorStudentLink(...a),
}));

const studentId = "00000000-0000-4000-8000-000000000010";
const tutorId = "00000000-0000-4000-8000-000000000020";
const tutorAdminId = "00000000-0000-4000-8000-000000000030";

let tutorProfileRoleForId: Record<string, string> = {
  [tutorId]: "parent",
  [tutorAdminId]: "admin",
};

let tutorRelDeleteResult: { data: unknown[]; error: unknown } = {
  data: [{ tutor_id: tutorId }],
  error: null,
};

function mockAdminClient() {
  return {
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: (_col: string, id: string) => ({
              single: () => {
                if (id === studentId) return { data: { role: "student" }, error: null };
                const role = tutorProfileRoleForId[id];
                if (role) return { data: { role }, error: null };
                return { data: null, error: { message: "not found" } };
              },
            }),
          }),
        };
      }
      if (table === "tutor_student_rel") {
        const select = vi.fn().mockImplementation(async () => tutorRelDeleteResult);
        const eq2 = vi.fn(() => ({ select }));
        const eq1 = vi.fn(() => ({ eq: eq2 }));
        return { delete: vi.fn(() => ({ eq: eq1 })) };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdminClient(),
}));

describe("upsertAdminStudentTutorLinkAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tutorRelDeleteResult = { data: [{ tutor_id: tutorId }], error: null };
    tutorProfileRoleForId = {
      [tutorId]: "parent",
      [tutorAdminId]: "admin",
    };
    mockAssertAdmin.mockResolvedValue({});
    mockUpsertTutorStudentLink.mockResolvedValue({ ok: true });
  });

  it("returns forbidden when assertAdmin fails", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("no"));
    const r = await upsertAdminStudentTutorLinkAction({
      locale: "es",
      studentId,
      newTutorId: tutorId,
      relationship: "mother",
    });
    expect(r).toEqual({ ok: false, message: U.detailErrForbidden });
    expect(mockUpsertTutorStudentLink).not.toHaveBeenCalled();
  });

  it("returns relationship required when relationship is missing", async () => {
    const r = await upsertAdminStudentTutorLinkAction({
      locale: "es",
      studentId,
      newTutorId: tutorId,
    });
    expect(r).toEqual({ ok: false, message: U.detailErrTutorRelationshipRequired });
    expect(mockUpsertTutorStudentLink).not.toHaveBeenCalled();
  });

  it("upserts link and records audit when valid", async () => {
    const r = await upsertAdminStudentTutorLinkAction({
      locale: "es",
      studentId,
      newTutorId: tutorId,
      relationship: "mother",
    });
    expect(r.ok).toBe(true);
    expect(mockUpsertTutorStudentLink).toHaveBeenCalledWith(
      expect.anything(),
      tutorId,
      studentId,
      "mother",
    );
    expect(mockRecordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "admin_user_detail_upsert_tutor_link",
        resourceType: "tutor_student_rel",
        resourceId: studentId,
        payload: { tutorId, relationship: "mother" },
      }),
    );
  });
});

describe("removeAdminStudentTutorLinkAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tutorRelDeleteResult = { data: [{ tutor_id: tutorId }], error: null };
    tutorProfileRoleForId = {
      [tutorId]: "parent",
      [tutorAdminId]: "admin",
    };
    mockAssertAdmin.mockResolvedValue({});
  });

  it("returns forbidden when assertAdmin fails", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("no"));
    const r = await removeAdminStudentTutorLinkAction({
      locale: "es",
      studentId,
      tutorId,
    });
    expect(r).toEqual({ ok: false, message: U.detailErrForbidden });
  });

  it("deletes link, revalidates, and records audit when row existed", async () => {
    const r = await removeAdminStudentTutorLinkAction({
      locale: "es",
      studentId,
      tutorId,
    });
    expect(r.ok).toBe(true);
    expect(r.message).toBe(U.detailToastTutorUnlinked);
    expect(mockRecordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "admin_user_detail_remove_tutor_link",
        resourceType: "tutor_student_rel",
        resourceId: studentId,
        payload: { tutorId },
      }),
    );
  });

  it("allows unlink when linked tutor profile is admin (DNI reuse path)", async () => {
    tutorRelDeleteResult = { data: [{ tutor_id: tutorAdminId }], error: null };
    const r = await removeAdminStudentTutorLinkAction({
      locale: "es",
      studentId,
      tutorId: tutorAdminId,
    });
    expect(r.ok).toBe(true);
    expect(r.message).toBe(U.detailToastTutorUnlinked);
  });

  it("returns tutor link not found when delete affects no rows", async () => {
    tutorRelDeleteResult = { data: [], error: null };
    const r = await removeAdminStudentTutorLinkAction({
      locale: "es",
      studentId,
      tutorId,
    });
    expect(r).toEqual({ ok: false, message: U.detailErrTutorLinkNotFound });
  });
});

describe("createAdminParentAndLinkStudentAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tutorRelDeleteResult = { data: [{ tutor_id: tutorId }], error: null };
    tutorProfileRoleForId = {
      [tutorId]: "parent",
      [tutorAdminId]: "admin",
    };
    mockAssertAdmin.mockResolvedValue({});
    mockEnsureParent.mockResolvedValue({ ok: true, parentId: tutorId, reuseKind: "created" });
    mockUpsertTutorStudentLink.mockResolvedValue({ ok: true });
  });

  it("returns forbidden when assertAdmin fails", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("no"));
    const r = await createAdminParentAndLinkStudentAction({
      locale: "es",
      studentId,
      tutorDni: "12345678",
      tutorFirstName: "Pat",
      tutorLastName: "Lee",
      tutorEmail: "",
      relationship: "mother",
    });
    expect(r).toEqual({ ok: false, message: U.detailErrForbidden });
  });

  it("creates or resolves parent and links student", async () => {
    const r = await createAdminParentAndLinkStudentAction({
      locale: "es",
      studentId,
      tutorDni: "12345678",
      tutorFirstName: "Pat",
      tutorLastName: "Lee",
      tutorEmail: "",
      relationship: "mother",
    });
    expect(r.ok).toBe(true);
    expect(r.message).toBe(U.detailToastTutorCreatedLinked);
    expect(mockEnsureParent).toHaveBeenCalled();
    expect(mockUpsertTutorStudentLink).toHaveBeenCalledWith(
      expect.anything(),
      tutorId,
      studentId,
      "mother",
    );
    expect(mockRecordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "admin_user_detail_create_parent_link",
        resourceType: "tutor_student_rel",
        resourceId: studentId,
        payload: expect.objectContaining({
          parentId: tutorId,
          reuseKind: "created",
          relationship: "mother",
        }),
      }),
    );
  });

  it("maps tutor_dni_in_use_by_student to dictionary message", async () => {
    mockEnsureParent.mockResolvedValue({ ok: false, message: "tutor_dni_in_use_by_student" });
    const r = await createAdminParentAndLinkStudentAction({
      locale: "es",
      studentId,
      tutorDni: "99999999",
      tutorFirstName: "X",
      tutorLastName: "Y",
      tutorEmail: "",
      relationship: "father",
    });
    expect(r.ok).toBe(false);
    expect(r.message).toBe(U.detailTutorCreateErrDniStudent);
  });

  it("requires confirmation before linking reused admin profile by DNI", async () => {
    mockEnsureParent.mockResolvedValue({ ok: true, parentId: tutorAdminId, reuseKind: "reused_admin" });
    const r = await createAdminParentAndLinkStudentAction({
      locale: "es",
      studentId,
      tutorDni: "11111111",
      tutorFirstName: "Pat",
      tutorLastName: "Lee",
      tutorEmail: "",
      relationship: "mother",
    });
    expect(r).toEqual({
      ok: false,
      needsConfirmation: true,
      reuseKind: "reused_admin",
      existingProfileId: tutorAdminId,
    });
    expect(mockUpsertTutorStudentLink).not.toHaveBeenCalled();
  });

  it("links after staff confirms reused profile id", async () => {
    mockEnsureParent.mockResolvedValue({ ok: true, parentId: tutorAdminId, reuseKind: "reused_admin" });
    const r = await createAdminParentAndLinkStudentAction({
      locale: "es",
      studentId,
      tutorDni: "11111111",
      tutorFirstName: "Pat",
      tutorLastName: "Lee",
      tutorEmail: "",
      relationship: "mother",
      confirmReuseOfProfileId: tutorAdminId,
    });
    expect(r.ok).toBe(true);
    expect(r.message).toBe(U.detailToastTutorLinkedReusedAdmin);
    expect(mockUpsertTutorStudentLink).toHaveBeenCalledWith(
      expect.anything(),
      tutorAdminId,
      studentId,
      "mother",
    );
    expect(mockRecordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ reuseKind: "reused_admin", relationship: "mother" }),
      }),
    );
  });

  it("requires confirmation for reused parent profile", async () => {
    mockEnsureParent.mockResolvedValue({ ok: true, parentId: tutorId, reuseKind: "reused_parent" });
    const r = await createAdminParentAndLinkStudentAction({
      locale: "es",
      studentId,
      tutorDni: "22222222",
      tutorFirstName: "A",
      tutorLastName: "B",
      tutorEmail: "",
      relationship: "father",
    });
    expect(r).toEqual({
      ok: false,
      needsConfirmation: true,
      reuseKind: "reused_parent",
      existingProfileId: tutorId,
    });
  });
});
