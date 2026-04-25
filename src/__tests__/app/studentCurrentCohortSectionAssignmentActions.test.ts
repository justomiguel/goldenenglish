// REGRESSION CHECK: Assigning from the admin student profile must stay scoped to
// the active cohort and transfer an existing current-cohort enrollment instead
// of creating a duplicate active row for the same student.
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assignStudentToCurrentCohortSectionAction,
  previewStudentCurrentCohortSectionAssignmentAction,
} from "@/app/[locale]/dashboard/admin/users/studentCurrentCohortSectionAssignmentActions";

const studentId = "00000000-0000-4000-8000-000000000010";
const sectionId = "00000000-0000-4000-8000-000000000020";
const otherSectionId = "00000000-0000-4000-8000-000000000030";

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
  current: { enrollmentId: "enrollment-current", sectionId: otherSectionId, sectionName: "B1" },
  hasMultipleCurrentAssignments: false,
};

describe("student current cohort section assignment actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertAdmin.mockResolvedValue({ supabase: mockSupabase() });
    roleMaybeSingle.mockResolvedValue({ data: { role: "student" }, error: null });
    loadAssignment.mockResolvedValue(assignment);
    buildPreview.mockResolvedValue({ ok: true, parentPaymentsPending: false });
    commitRpc.mockResolvedValue({ ok: true, enrollmentId: "enrollment-new" });
    recordSystemAudit.mockResolvedValue({ ok: true });
  });

  it("previews with the current cohort enrollment ignored", async () => {
    const result = await previewStudentCurrentCohortSectionAssignmentAction({
      studentId,
      sectionId,
      allowCapacityOverride: true,
    });

    expect(result).toEqual({ ok: true, parentPaymentsPending: false });
    expect(buildPreview).toHaveBeenCalledWith(expect.anything(), {
      studentId,
      sectionId,
      ignoreEnrollmentId: "enrollment-current",
      ignoreCapacity: true,
    });
  });

  it("commits assignment as a transfer from the current cohort enrollment", async () => {
    const result = await assignStudentToCurrentCohortSectionAction({
      locale: "en",
      studentId,
      sectionId,
      allowCapacityOverride: false,
    });

    expect(result).toEqual({ ok: true, enrollmentId: "enrollment-new" });
    expect(commitRpc).toHaveBeenCalledWith(expect.anything(), {
      studentId,
      sectionId,
      dropId: "enrollment-current",
      dropNext: "transferred",
      allowCapacityOverride: false,
    });
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "admin_student_profile_current_cohort_section_assign",
        resourceType: "section_enrollment",
        resourceId: "enrollment-new",
      }),
    );
  });

  it("rejects a section outside the current cohort assignment options", async () => {
    const result = await assignStudentToCurrentCohortSectionAction({
      locale: "en",
      studentId,
      sectionId: "00000000-0000-4000-8000-000000000099",
    });

    expect(result).toEqual({ ok: false, code: "SECTION_NOT_CURRENT" });
    expect(commitRpc).not.toHaveBeenCalled();
  });

  it("rejects non-student target profiles", async () => {
    roleMaybeSingle.mockResolvedValueOnce({ data: { role: "teacher" }, error: null });

    const result = await assignStudentToCurrentCohortSectionAction({
      locale: "en",
      studentId,
      sectionId,
    });

    expect(result).toEqual({ ok: false, code: "NOT_STUDENT" });
    expect(loadAssignment).not.toHaveBeenCalled();
  });
});
