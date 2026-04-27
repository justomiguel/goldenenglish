// REGRESSION CHECK: Tutor link actions require admin session, student target, parent tutor, and audit on success.
import { describe, it, expect, vi, beforeEach } from "vitest";
import es from "@/dictionaries/es.json";
import {
  upsertAdminStudentTutorLinkAction,
  createAdminParentAndLinkStudentAction,
} from "@/app/[locale]/dashboard/admin/users/adminUserDetailTutorActions";

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

function mockAdminClient() {
  return {
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: (_col: string, id: string) => ({
              single: () => {
                if (id === studentId) return { data: { role: "student" }, error: null };
                if (id === tutorId) return { data: { role: "parent" }, error: null };
                return { data: null, error: { message: "not found" } };
              },
            }),
          }),
        };
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
    mockAssertAdmin.mockResolvedValue({});
    mockUpsertTutorStudentLink.mockResolvedValue({ ok: true });
  });

  it("returns forbidden when assertAdmin fails", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("no"));
    const r = await upsertAdminStudentTutorLinkAction({
      locale: "es",
      studentId,
      newTutorId: tutorId,
    });
    expect(r).toEqual({ ok: false, message: U.detailErrForbidden });
    expect(mockUpsertTutorStudentLink).not.toHaveBeenCalled();
  });

  it("upserts link and records audit when valid", async () => {
    const r = await upsertAdminStudentTutorLinkAction({
      locale: "es",
      studentId,
      newTutorId: tutorId,
    });
    expect(r.ok).toBe(true);
    expect(mockUpsertTutorStudentLink).toHaveBeenCalledWith(
      expect.anything(),
      tutorId,
      studentId,
      null,
    );
    expect(mockRecordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "admin_user_detail_upsert_tutor_link",
        resourceType: "tutor_student_rel",
        resourceId: studentId,
      }),
    );
  });
});

describe("createAdminParentAndLinkStudentAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertAdmin.mockResolvedValue({});
    mockEnsureParent.mockResolvedValue({ ok: true, parentId: tutorId });
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
      relationship: null,
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
      relationship: "Mother",
    });
    expect(r.ok).toBe(true);
    expect(mockEnsureParent).toHaveBeenCalled();
    expect(mockUpsertTutorStudentLink).toHaveBeenCalledWith(
      expect.anything(),
      tutorId,
      studentId,
      "Mother",
    );
    expect(mockRecordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "admin_user_detail_create_parent_link",
        resourceType: "tutor_student_rel",
        resourceId: studentId,
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
    });
    expect(r.ok).toBe(false);
    expect(r.message).toBe(U.detailTutorCreateErrDniStudent);
  });
});
