"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { recordStudentEnrollmentAudit } from "@/lib/dashboard/studentMutationAudit";
import { buildSectionEnrollmentPreview } from "@/lib/academics/buildSectionEnrollmentPreview";
import { commitSectionEnrollmentRpc } from "@/lib/academics/commitSectionEnrollmentRpc";
import { cancelReminderJobsForEnrollmentId } from "@/lib/notifications/cancelReminderJobsAdmin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  isStudentProfile,
  prepareStudentCurrentCohortSectionAdd,
} from "@/lib/dashboard/prepareStudentCurrentCohortSectionAdd";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import type { PreviewSectionEnrollmentResult } from "@/types/academics";

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

export async function previewStudentCurrentCohortSectionAssignmentAction(input: {
  studentId: string;
  sectionId: string;
  allowCapacityOverride?: boolean;
}): Promise<StudentCurrentCohortAssignmentPreviewResult> {
  try {
    const prepared = await prepareStudentCurrentCohortSectionAdd(input);
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
    const prepared = await prepareStudentCurrentCohortSectionAdd(input);
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
    const addedSectionName =
      prepared.assignment.sections.find((s) => s.id === prepared.sectionId)?.name ??
      prepared.sectionId;
    void recordStudentEnrollmentAudit({
      studentId: prepared.studentId,
      action: "add_section",
      summary: `Alta en sección ${addedSectionName}`,
      beforeSection:
        prepared.assignment.currentSections.map((s) => s.sectionName).join(", ") || "—",
      afterSection: [
        ...prepared.assignment.currentSections.map((s) => s.sectionName),
        addedSectionName,
      ].join(", "),
      cohortName: prepared.assignment.cohortName,
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
    void recordStudentEnrollmentAudit({
      studentId: studentParsed.data,
      action: "remove_section",
      summary: `Baja de sección`,
      beforeSection: enrollmentParsed.data,
      afterSection: "—",
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
