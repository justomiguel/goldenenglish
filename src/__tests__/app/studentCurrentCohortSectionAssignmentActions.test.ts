import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addStudentToSectionAction,
  removeStudentFromSectionAction,
  previewStudentCurrentCohortSectionAssignmentAction,
} from "@/app/[locale]/dashboard/admin/users/studentCurrentCohortSectionAssignmentActions";

const studentId = "00000000-0000-4000-8000-000000000010";
const sectionId = "00000000-0000-4000-8000-000000000020";
const otherSectionId = "00000000-0000-4000-8000-000000000030";
const enrollmentId = "00000000-0000-4000-8000-000000000040";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/revalidatePaths", () => ({
  revalidateAcademicSurfaces: vi.fn(),
}));

const recordSystemAudit = vi.fn();
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: (...a: unknown[]) => recordSystemAudit(...a),
}));

vi.mock("@/lib/notifications/cancelReminderJobsAdmin", () => ({
  cancelReminderJobsForEnrollmentId: vi.fn().mockResolvedValue(undefined),
}));

const mockAssertAdmin = vi.fn();
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

const loadAssignment = vi.fn();
vi.mock("@/lib/dashboard/loadAdminStudentCurrentCohortAssignment", () => ({
  loadAdminStudentCurrentCohortAssignment: (...a: unknown[]) => loadAssignment(...a),
}));

const buildPreview = vi.fn();
vi.mock("@/lib/academics/buildSectionEnrollmentPreview", () => ({
  buildSectionEnrollmentPreview: (...a: unknown[]) => buildPreview(...a),
}));

const commitRpc = vi.fn();
vi.mock("@/lib/academics/commitSectionEnrollmentRpc", () => ({
  commitSectionEnrollmentRpc: (...a: unknown[]) => commitRpc(...a),
}));

const roleMaybeSingle = vi.fn();
const enrollmentMaybeSingle = vi.fn();
const enrollmentUpdate = vi.fn();

function mockSupabase() {
  return {
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: roleMaybeSingle,
            }),
          }),
        };
      }
      if (table === "section_enrollments") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: enrollmentMaybeSingle,
                }),
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: enrollmentUpdate,
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    }),
  };
}

const assignment = {
  cohortId: "cohort-1",
  cohortName: "2026",
  sections: [
    { id: sectionId, name: "A1", teacherName: "Ada", activeCount: 5, maxStudents: 12 },
    { id: otherSectionId, name: "B1", teacherName: "Grace", activeCount: 3, maxStudents: 12 },
  ],
  current: { enrollmentId: enrollmentId, sectionId: otherSectionId, sectionName: "B1" },
  currentSections: [
    { enrollmentId: enrollmentId, sectionId: otherSectionId, sectionName: "B1" },
  ],
  hasMultipleCurrentAssignments: false,
};

describe("student multi-section assignment actions", () => {
  // REGRESSION CHECK: RPC enrollment errors must stay on the public action code union
  // because the admin assignment card maps those stable codes to localized messages.
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertAdmin.mockResolvedValue({ supabase: mockSupabase() });
    roleMaybeSingle.mockResolvedValue({ data: { role: "student" }, error: null });
    loadAssignment.mockResolvedValue(assignment);
    buildPreview.mockResolvedValue({ ok: true, parentPaymentsPending: false });
    commitRpc.mockResolvedValue({ ok: true, enrollmentId: "enrollment-new" });
    recordSystemAudit.mockResolvedValue({ ok: true });
    enrollmentMaybeSingle.mockResolvedValue({
      data: { id: enrollmentId, student_id: studentId, status: "active" },
      error: null,
    });
    enrollmentUpdate.mockResolvedValue({ error: null });
  });

  it("previews adding to a new section without dropping existing", async () => {
    const result = await previewStudentCurrentCohortSectionAssignmentAction({
      studentId,
      sectionId,
      allowCapacityOverride: true,
    });

    expect(result).toEqual({ ok: true, parentPaymentsPending: false });
    expect(buildPreview).toHaveBeenCalledWith(expect.anything(), {
      studentId,
      sectionId,
      ignoreEnrollmentId: null,
      ignoreCapacity: true,
    });
  });

  it("adds student to a new section (no drop)", async () => {
    const result = await addStudentToSectionAction({
      locale: "en",
      studentId,
      sectionId,
      allowCapacityOverride: false,
    });

    expect(result).toEqual({ ok: true, enrollmentId: "enrollment-new" });
    expect(commitRpc).toHaveBeenCalledWith(expect.anything(), {
      studentId,
      sectionId,
      dropId: null,
      dropNext: "dropped",
      allowCapacityOverride: false,
    });
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "admin_student_section_add",
        resourceType: "section_enrollment",
        resourceId: "enrollment-new",
      }),
    );
  });

  it("propagates section enrollment RPC failure codes", async () => {
    commitRpc.mockResolvedValueOnce({ ok: false, code: "CAPACITY_EXCEEDED" });

    const result = await addStudentToSectionAction({
      locale: "en",
      studentId,
      sectionId,
    });

    expect(result).toEqual({ ok: false, code: "CAPACITY_EXCEEDED" });
    expect(recordSystemAudit).not.toHaveBeenCalled();
  });

  it("rejects adding to a section the student is already in", async () => {
    const result = await addStudentToSectionAction({
      locale: "en",
      studentId,
      sectionId: otherSectionId,
    });

    expect(result).toEqual({ ok: false, code: "ALREADY_ACTIVE" });
    expect(commitRpc).not.toHaveBeenCalled();
  });

  it("rejects a section outside the current cohort", async () => {
    const result = await addStudentToSectionAction({
      locale: "en",
      studentId,
      sectionId: "00000000-0000-4000-8000-000000000099",
    });

    expect(result).toEqual({ ok: false, code: "SECTION_NOT_CURRENT" });
    expect(commitRpc).not.toHaveBeenCalled();
  });

  it("rejects non-student profiles", async () => {
    roleMaybeSingle.mockResolvedValueOnce({ data: { role: "teacher" }, error: null });

    const result = await addStudentToSectionAction({
      locale: "en",
      studentId,
      sectionId,
    });

    expect(result).toEqual({ ok: false, code: "NOT_STUDENT" });
    expect(loadAssignment).not.toHaveBeenCalled();
  });

  it("removes student from a section", async () => {
    const result = await removeStudentFromSectionAction({
      locale: "en",
      studentId,
      enrollmentId,
    });

    expect(result).toEqual({ ok: true });
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "admin_student_section_remove",
        resourceType: "section_enrollment",
        resourceId: enrollmentId,
      }),
    );
  });

  it("rejects removing non-existent enrollment", async () => {
    enrollmentMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const result = await removeStudentFromSectionAction({
      locale: "en",
      studentId,
      enrollmentId: "00000000-0000-4000-8000-000000000099",
    });

    expect(result).toEqual({ ok: false, code: "NOT_ENROLLED" });
  });
});
