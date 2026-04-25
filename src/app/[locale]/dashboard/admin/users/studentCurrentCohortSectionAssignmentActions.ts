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
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import type { PreviewSectionEnrollmentResult } from "@/types/academics";
import type { SupabaseClient } from "@supabase/supabase-js";

const uuid = z.string().uuid();

export type StudentCurrentCohortAssignmentCode =
  | "PARSE"
  | "UNAUTHORIZED"
  | "NOT_STUDENT"
  | "NO_CURRENT_COHORT"
  | "SECTION_NOT_CURRENT"
  | "ALREADY_ACTIVE"
  | "SCHEDULE_OVERLAP"
  | "CAPACITY_EXCEEDED"
  | "NOT_ENROLLED"
  | "LAST_SECTION"
  | "RPC";

type PreparedAdd =
  | {
      ok: true;
      supabase: SupabaseClient;
      studentId: string;
      sectionId: string;
      assignment: AdminStudentCurrentCohortAssignment;
    }
  | {
      ok: false;
      code:
        | "PARSE"
        | "NOT_STUDENT"
        | "NO_CURRENT_COHORT"
        | "SECTION_NOT_CURRENT"
        | "ALREADY_ACTIVE";
    };

export type StudentCurrentCohortAssignmentPreviewResult =
  | PreviewSectionEnrollmentResult
  | {
      ok: false;
      code:
        | "UNAUTHORIZED"
        | "NOT_STUDENT"
        | "NO_CURRENT_COHORT"
        | "SECTION_NOT_CURRENT"
        | "RPC";
    };

export type StudentCurrentCohortAssignmentCommitResult =
  | { ok: true; enrollmentId: string }
  | { ok: false; code: StudentCurrentCohortAssignmentCode };

export type StudentSectionRemoveResult =
  | { ok: true }
  | { ok: false; code: StudentCurrentCohortAssignmentCode };

async function isStudentProfile(supabase: SupabaseClient, studentId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", studentId)
    .maybeSingle();
  return !error && data?.role === "student";
}

async function prepareAdd(input: {
  studentId: string;
  sectionId: string;
}): Promise<PreparedAdd> {
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
  const alreadyIn = assignment.currentSections.some((cs) => cs.sectionId === section.data);
  if (alreadyIn) return { ok: false, code: "ALREADY_ACTIVE" };

  return { ok: true, supabase, studentId: student.data, sectionId: section.data, assignment };
}

export async function previewStudentCurrentCohortSectionAssignmentAction(input: {
  studentId: string;
  sectionId: string;
  allowCapacityOverride?: boolean;
}): Promise<StudentCurrentCohortAssignmentPreviewResult> {
  try {
    const prepared = await prepareAdd(input);
    if (!prepared.ok) return prepared;

    return await buildSectionEnrollmentPreview(prepared.supabase, {
      studentId: prepared.studentId,
      sectionId: prepared.sectionId,
      ignoreEnrollmentId: null,
      ignoreCapacity: Boolean(input.allowCapacityOverride),
    });
  } catch (err) {
    logServerException("previewStudentCurrentCohortSectionAssignmentAction", err);
    return { ok: false, code: "UNAUTHORIZED" };
  }
}

export async function addStudentToSectionAction(input: {
  locale: string;
  studentId: string;
  sectionId: string;
  allowCapacityOverride?: boolean;
}): Promise<StudentCurrentCohortAssignmentCommitResult> {
  try {
    const prepared = await prepareAdd(input);
    if (!prepared.ok) return prepared;

    const preview = await buildSectionEnrollmentPreview(prepared.supabase, {
      studentId: prepared.studentId,
      sectionId: prepared.sectionId,
      ignoreEnrollmentId: null,
      ignoreCapacity: Boolean(input.allowCapacityOverride),
    });
    if (!preview.ok) return { ok: false, code: preview.code };

    const committed = await commitSectionEnrollmentRpc(prepared.supabase, {
      studentId: prepared.studentId,
      sectionId: prepared.sectionId,
      dropId: null,
      dropNext: "dropped",
      allowCapacityOverride: Boolean(input.allowCapacityOverride),
    });
    if (!committed.ok) return { ok: false, code: committed.code };

    void recordSystemAudit({
      action: "admin_student_section_add",
      resourceType: "section_enrollment",
      resourceId: committed.enrollmentId,
      payload: {
        studentId: prepared.studentId,
        cohortId: prepared.assignment.cohortId,
        sectionId: prepared.sectionId,
        allowCapacityOverride: Boolean(input.allowCapacityOverride),
      },
    });

    revalidateAcademicSurfaces(input.locale);
    revalidatePath(`/${input.locale}/dashboard/admin/users/${prepared.studentId}`);
    revalidatePath(`/${input.locale}/dashboard/admin/users/${prepared.studentId}/billing`);
    return committed;
  } catch (err) {
    logServerException("addStudentToSectionAction", err);
    return { ok: false, code: "UNAUTHORIZED" };
  }
}

export async function removeStudentFromSectionAction(input: {
  locale: string;
  studentId: string;
  enrollmentId: string;
}): Promise<StudentSectionRemoveResult> {
  try {
    const studentParsed = uuid.safeParse(input.studentId);
    const enrollmentParsed = uuid.safeParse(input.enrollmentId);
    if (!studentParsed.success || !enrollmentParsed.success) {
      return { ok: false, code: "PARSE" };
    }

    const { supabase } = await assertAdmin();
    const isStudent = await isStudentProfile(supabase, studentParsed.data);
    if (!isStudent) return { ok: false, code: "NOT_STUDENT" };

    const { data: enrollment, error: enrollErr } = await supabase
      .from("section_enrollments")
      .select("id, student_id, status")
      .eq("id", enrollmentParsed.data)
      .eq("student_id", studentParsed.data)
      .eq("status", "active")
      .maybeSingle();

    if (enrollErr) {
      logSupabaseClientError("removeStudentFromSectionAction:find", enrollErr);
      return { ok: false, code: "RPC" };
    }
    if (!enrollment) return { ok: false, code: "NOT_ENROLLED" };

    const { error: updateErr } = await supabase
      .from("section_enrollments")
      .update({ status: "dropped" })
      .eq("id", enrollmentParsed.data);

    if (updateErr) {
      logSupabaseClientError("removeStudentFromSectionAction:update", updateErr);
      return { ok: false, code: "RPC" };
    }

    await cancelReminderJobsForEnrollmentId(
      enrollmentParsed.data,
      "removeStudentFromSectionAction",
    );

    void recordSystemAudit({
      action: "admin_student_section_remove",
      resourceType: "section_enrollment",
      resourceId: enrollmentParsed.data,
      payload: { studentId: studentParsed.data },
    });

    revalidateAcademicSurfaces(input.locale);
    revalidatePath(`/${input.locale}/dashboard/admin/users/${studentParsed.data}`);
    revalidatePath(`/${input.locale}/dashboard/admin/users/${studentParsed.data}/billing`);
    return { ok: true };
  } catch (err) {
    logServerException("removeStudentFromSectionAction", err);
    return { ok: false, code: "UNAUTHORIZED" };
  }
}

/** @deprecated Use `addStudentToSectionAction` instead. */
export const assignStudentToCurrentCohortSectionAction = addStudentToSectionAction;
