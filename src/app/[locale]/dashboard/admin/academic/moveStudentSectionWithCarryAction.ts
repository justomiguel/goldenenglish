"use server";

import { z } from "zod";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { getDefaultSectionMaxStudents } from "@/lib/academics/getDefaultSectionMaxStudents";
import { loadSectionMoveCarryFacts, type SectionMoveCarryFacts } from "@/lib/academics/loadSectionMoveCarryFacts";
import {
  planSectionMoveCarry,
  type CarryResolution,
  type SectionMoveCarryFlags,
} from "@/lib/academics/planSectionMoveCarry";
import {
  formatCarryCollisionDetail,
  mapSectionMoveCarryRpcError,
} from "@/lib/academics/sectionMoveCarryFailureMessage";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  logServerAuthzDenied,
  logServerException,
  logServerWarn,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import { cancelReminderJobsForEnrollmentId } from "@/lib/notifications/cancelReminderJobsAdmin";
import { revalidateRegistrationInbox } from "@/lib/register/registrationIntakeActionSupport";

const uuid = z.string().uuid();
const flagsZ = z.object({
  payments: z.boolean(),
  scholarships: z.boolean(),
  enrollmentFee: z.boolean(),
  annualSettlement: z.boolean(),
  attendance: z.boolean(),
  grades: z.boolean(),
});
const choiceZ = z.object({ originId: uuid, choice: z.enum(["leave", "replace"]) });

export type MoveStudentSectionWithCarryResult =
  | { ok: true; enrollmentId: string }
  | { ok: false; code: string; detail?: string };

export async function previewSectionMoveCarryAction(input: {
  studentId: string;
  toSectionId: string;
  fromEnrollmentIds: string[];
}): Promise<{ ok: true; facts: SectionMoveCarryFacts } | { ok: false; code: string }> {
  let supabase;
  try {
    ({ supabase } = await assertAdmin());
  } catch {
    logServerAuthzDenied("previewSectionMoveCarry");
    return { ok: false, code: "forbidden" };
  }
  const studentId = uuid.safeParse(input.studentId);
  const toSectionId = uuid.safeParse(input.toSectionId);
  const fromEnrollmentIds = z.array(uuid).safeParse(input.fromEnrollmentIds);
  if (!studentId.success || !toSectionId.success || !fromEnrollmentIds.success) {
    return { ok: false, code: "not_found" };
  }
  return loadSectionMoveCarryFacts(supabase, {
    studentId: studentId.data,
    toSectionId: toSectionId.data,
    fromEnrollmentIds: fromEnrollmentIds.data,
  });
}

export async function moveStudentSectionWithCarryAction(input: {
  locale: string;
  studentId: string;
  toSectionId: string;
  fromEnrollmentIds: string[];
  alsoTransferEnrollmentId?: string | null;
  allowCapacityOverride?: boolean;
  carry: SectionMoveCarryFlags;
  choices: CarryResolution[];
}): Promise<MoveStudentSectionWithCarryResult> {
  let supabase;
  try {
    ({ supabase } = await assertAdmin());
  } catch {
    logServerAuthzDenied("moveStudentSectionWithCarry");
    return { ok: false, code: "forbidden" };
  }
  try {
    const studentId = uuid.safeParse(input.studentId);
    const toSectionId = uuid.safeParse(input.toSectionId);
    const fromEnrollmentIds = z.array(uuid).safeParse(input.fromEnrollmentIds);
    const flags = flagsZ.safeParse(input.carry);
    const choices = z.array(choiceZ).safeParse(input.choices);
    const also = input.alsoTransferEnrollmentId
      ? uuid.safeParse(input.alsoTransferEnrollmentId)
      : { success: true as const, data: null };
    if (!studentId.success || !toSectionId.success || !fromEnrollmentIds.success || !flags.success || !choices.success || !also.success) {
      return { ok: false, code: "not_found" };
    }

    const loaded = await loadSectionMoveCarryFacts(supabase, {
      studentId: studentId.data,
      toSectionId: toSectionId.data,
      fromEnrollmentIds: fromEnrollmentIds.data,
    });
    if (!loaded.ok) return loaded;

    const planned = planSectionMoveCarry({
      flags: flags.data,
      ...loaded.facts,
      choices: choices.data,
    });
    if (!planned.ok) {
      await logServerWarn("moveStudentSectionWithCarry", { code: "carry_choice_missing" });
      return {
        ok: false,
        code: "carry_choice_missing",
        detail: formatCarryCollisionDetail(planned.collision, input.locale),
      };
    }

    const { data, error } = await supabase.rpc("move_student_section_with_carry", {
      p_student_id: studentId.data,
      p_to_section_id: toSectionId.data,
      p_from_enrollment_ids: fromEnrollmentIds.data,
      p_also_transfer_enrollment_id: also.data,
      p_allow_capacity_override: Boolean(input.allowCapacityOverride),
      p_default_max_students: getDefaultSectionMaxStudents(),
      p_carry: flags.data,
      p_choices: choices.data,
    });
    if (error) {
      await logSupabaseClientError("moveStudentSectionWithCarry", error, { studentId: studentId.data });
      const mapped = mapSectionMoveCarryRpcError(error.message ?? "");
      return { ok: false, code: mapped.code, detail: mapped.detail };
    }
    const enrollmentId = (data as { enrollment_id?: string } | null)?.enrollment_id;
    if (!enrollmentId) return { ok: false, code: "save_failed" };

    for (const enrollmentIdToCancel of [...fromEnrollmentIds.data, also.data].filter(Boolean)) {
      await cancelReminderJobsForEnrollmentId(String(enrollmentIdToCancel), "moveStudentSectionWithCarry");
    }
    await recordSystemAudit({
      action: "academic_section_move_carry",
      resourceType: "section_enrollment",
      resourceId: enrollmentId,
      payload: {
        studentId: studentId.data,
        toSectionId: toSectionId.data,
        fromEnrollmentIds: fromEnrollmentIds.data,
        flags: flags.data,
        choices: choices.data,
      },
    });
    revalidateAcademicSurfaces(input.locale);
    revalidateRegistrationInbox(input.locale);
    return { ok: true, enrollmentId };
  } catch (err) {
    logServerException("moveStudentSectionWithCarry", err);
    return { ok: false, code: "save_failed" };
  }
}
