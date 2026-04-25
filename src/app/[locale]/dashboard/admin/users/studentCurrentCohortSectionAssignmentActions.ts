"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { buildSectionEnrollmentPreview } from "@/lib/academics/buildSectionEnrollmentPreview";
import { commitSectionEnrollmentRpc } from "@/lib/academics/commitSectionEnrollmentRpc";
import { cancelReminderJobsForEnrollmentId } from "@/lib/notifications/cancelReminderJobsAdmin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  loadAdminStudentCurrentCohortAssignment,
  type AdminStudentCurrentCohortAssignment,
} from "@/lib/dashboard/loadAdminStudentCurrentCohortAssignment";
import { logServerException } from "@/lib/logging/serverActionLog";
import type { PreviewSectionEnrollmentResult } from "@/types/academics";
import type { SupabaseClient } from "@supabase/supabase-js";

const uuid = z.string().uuid();

export type StudentCurrentCohortAssignmentCode =
  | "PARSE"
  | "UNAUTHORIZED"
  | "NOT_STUDENT"
  | "NO_CURRENT_COHORT"
  | "SECTION_NOT_CURRENT"
  | "MULTIPLE_CURRENT_ASSIGNMENTS"
  | "ALREADY_ACTIVE"
  | "SCHEDULE_OVERLAP"
  | "CAPACITY_EXCEEDED"
  | "RPC";

type PreparedAssignment =
  | {
      ok: true;
      supabase: SupabaseClient;
      studentId: string;
      sectionId: string;
      assignment: AdminStudentCurrentCohortAssignment;
      dropEnrollmentId: string | null;
    }
  | { ok: false; code: StudentCurrentCohortAssignmentCode };

export type StudentCurrentCohortAssignmentPreviewResult =
  | PreviewSectionEnrollmentResult
  | {
      ok: false;
      code:
        | "UNAUTHORIZED"
        | "NOT_STUDENT"
        | "NO_CURRENT_COHORT"
        | "SECTION_NOT_CURRENT"
        | "MULTIPLE_CURRENT_ASSIGNMENTS"
        | "RPC";
    };

export type StudentCurrentCohortAssignmentCommitResult =
  | { ok: true; enrollmentId: string }
  | { ok: false; code: StudentCurrentCohortAssignmentCode };

async function isStudentProfile(supabase: SupabaseClient, studentId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", studentId)
    .maybeSingle();
  return !error && data?.role === "student";
}

async function prepareAssignment(input: {
  studentId: string;
  sectionId: string;
}): Promise<PreparedAssignment> {
  const student = uuid.safeParse(input.studentId);
  const section = uuid.safeParse(input.sectionId);
  if (!student.success || !section.success) return { ok: false, code: "PARSE" };

  const { supabase } = await assertAdmin();
  const isStudent = await isStudentProfile(supabase, student.data);
  if (!isStudent) return { ok: false, code: "NOT_STUDENT" };

  const assignment = await loadAdminStudentCurrentCohortAssignment(supabase, student.data);
  if (!assignment.cohortId) return { ok: false, code: "NO_CURRENT_COHORT" };
  if (!assignment.sections.some((option) => option.id === section.data)) {
    return { ok: false, code: "SECTION_NOT_CURRENT" };
  }
  if (assignment.hasMultipleCurrentAssignments) {
    return { ok: false, code: "MULTIPLE_CURRENT_ASSIGNMENTS" };
  }
  if (assignment.current?.sectionId === section.data) {
    return { ok: false, code: "ALREADY_ACTIVE" };
  }

  return {
    ok: true,
    supabase,
    studentId: student.data,
    sectionId: section.data,
    assignment,
    dropEnrollmentId: assignment.current?.enrollmentId ?? null,
  };
}

export async function previewStudentCurrentCohortSectionAssignmentAction(input: {
  studentId: string;
  sectionId: string;
  allowCapacityOverride?: boolean;
}): Promise<StudentCurrentCohortAssignmentPreviewResult> {
  try {
    const prepared = await prepareAssignment(input);
    if (!prepared.ok) return prepared;

    return await buildSectionEnrollmentPreview(prepared.supabase, {
      studentId: prepared.studentId,
      sectionId: prepared.sectionId,
      ignoreEnrollmentId: prepared.dropEnrollmentId,
      ignoreCapacity: Boolean(input.allowCapacityOverride),
    });
  } catch (err) {
    logServerException("previewStudentCurrentCohortSectionAssignmentAction", err);
    return { ok: false, code: "UNAUTHORIZED" };
  }
}

export async function assignStudentToCurrentCohortSectionAction(input: {
  locale: string;
  studentId: string;
  sectionId: string;
  allowCapacityOverride?: boolean;
}): Promise<StudentCurrentCohortAssignmentCommitResult> {
  try {
    const prepared = await prepareAssignment(input);
    if (!prepared.ok) return prepared;

    const preview = await buildSectionEnrollmentPreview(prepared.supabase, {
      studentId: prepared.studentId,
      sectionId: prepared.sectionId,
      ignoreEnrollmentId: prepared.dropEnrollmentId,
      ignoreCapacity: Boolean(input.allowCapacityOverride),
    });
    if (!preview.ok) return { ok: false, code: preview.code };

    const committed = await commitSectionEnrollmentRpc(prepared.supabase, {
      studentId: prepared.studentId,
      sectionId: prepared.sectionId,
      dropId: prepared.dropEnrollmentId,
      dropNext: "transferred",
      allowCapacityOverride: Boolean(input.allowCapacityOverride),
    });
    if (!committed.ok) return committed;

    if (prepared.dropEnrollmentId) {
      await cancelReminderJobsForEnrollmentId(
        prepared.dropEnrollmentId,
        "assignStudentToCurrentCohortSectionAction",
      );
    }

    void recordSystemAudit({
      action: "admin_student_profile_current_cohort_section_assign",
      resourceType: "section_enrollment",
      resourceId: committed.enrollmentId,
      payload: {
        studentId: prepared.studentId,
        cohortId: prepared.assignment.cohortId,
        sectionId: prepared.sectionId,
        previousEnrollmentId: prepared.dropEnrollmentId,
        allowCapacityOverride: Boolean(input.allowCapacityOverride),
      },
    });

    revalidateAcademicSurfaces(input.locale);
    revalidatePath(`/${input.locale}/dashboard/admin/users/${prepared.studentId}`);
    revalidatePath(`/${input.locale}/dashboard/admin/users/${prepared.studentId}/billing`);
    return committed;
  } catch (err) {
    logServerException("assignStudentToCurrentCohortSectionAction", err);
    return { ok: false, code: "UNAUTHORIZED" };
  }
}
