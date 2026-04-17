"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";
import { getDefaultSectionMaxStudents } from "@/lib/academics/getDefaultSectionMaxStudents";
import { normalizeSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import {
  SECTION_LEAD_TEACHER_ELIGIBLE_ROLES,
  isProfileEligibleAsSectionLeadTeacher,
} from "@/lib/academics/sectionStaffEligibleRoles";
import { validateSectionPeriodAgainstCohort } from "@/lib/academics/validateSectionPeriodAgainstCohort";
import {
  logServerActionException,
  logServerActionInvariantViolation,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import type { SectionScheduleSlot } from "@/types/academics";

const uuid = z.string().uuid();

const S = {
  createSection: "createAcademicSectionAction",
  updateSectionSchedule: "updateAcademicSectionScheduleAction",
} as const;

export async function createAcademicSectionAction(input: {
  locale: string;
  cohortId: string;
  name: string;
  teacherId: string;
  startsOn: string;
  endsOn: string;
  scheduleSlots: SectionScheduleSlot[];
  maxStudents?: number | null;
}): Promise<{ ok: true; id: string } | { ok: false }> {
  const cohortId = uuid.safeParse(input.cohortId.trim());
  const teacherId = uuid.safeParse(input.teacherId.trim());
  const scheduleSlots = normalizeSectionScheduleSlots(input.scheduleSlots);
  if (!cohortId.success || !teacherId.success || !scheduleSlots || scheduleSlots.length === 0) {
    return { ok: false };
  }

  const name = input.name.trim();
  if (name.length < 2) return { ok: false };

  try {
    const { supabase } = await assertAdmin();
    const [cohortRes, teacherRes] = await Promise.all([
      supabase
        .from("academic_cohorts")
        .select("id, archived_at")
        .eq("id", cohortId.data)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id, role")
        .eq("id", teacherId.data)
        .in("role", [...SECTION_LEAD_TEACHER_ELIGIBLE_ROLES])
        .maybeSingle(),
    ]);

    const cohortRow = cohortRes.data as {
      id?: string;
      archived_at?: string | null;
    } | null;
    if (!cohortRow?.id || cohortRow.archived_at != null) return { ok: false };
    const teacherRow = teacherRes.data as { id?: string; role?: string } | null;
    if (!teacherRow?.id || !isProfileEligibleAsSectionLeadTeacher(teacherRow.role)) {
      return { ok: false };
    }

    const periodOk = validateSectionPeriodAgainstCohort({
      sectionStartsOn: input.startsOn,
      sectionEndsOn: input.endsOn,
    });
    if (!periodOk.ok) return { ok: false };

    let maxStudents: number | null = null;
    if (input.maxStudents != null && Number.isFinite(input.maxStudents)) {
      const n = Math.floor(Number(input.maxStudents));
      if (n > 0) maxStudents = n;
    }
    if (maxStudents === null) {
      maxStudents = getDefaultSectionMaxStudents();
    }

    const { data: row, error } = await supabase
      .from("academic_sections")
      .insert({
        cohort_id: cohortId.data,
        name,
        teacher_id: teacherId.data,
        starts_on: input.startsOn.trim(),
        ends_on: input.endsOn.trim(),
        schedule_slots: scheduleSlots,
        max_students: maxStudents,
      })
      .select("id")
      .single();

    if (error || !row?.id) {
      if (error) {
        logSupabaseClientError(S.createSection, error, {
          cohortId: cohortId.data,
          teacherId: teacherId.data,
          nameLen: name.length,
          scheduleCount: scheduleSlots.length,
        });
      } else {
        logServerActionInvariantViolation(S.createSection, "insert_ok_but_no_id", {
          cohortId: cohortId.data,
        });
      }
      return { ok: false };
    }

    void recordSystemAudit({
      action: "academic_section_created",
      resourceType: "academic_section",
      resourceId: row.id as string,
      payload: {
        cohort_id: cohortId.data,
        name,
        teacher_id: teacherId.data,
        starts_on: input.startsOn.trim(),
        ends_on: input.endsOn.trim(),
        max_students: maxStudents,
        schedule_slots: scheduleSlots,
      },
    });

    revalidateAcademicSurfaces(input.locale);
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${cohortId.data}`, "page");
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${cohortId.data}/${row.id}`, "page");
    return { ok: true, id: row.id as string };
  } catch (err) {
    logServerActionException(S.createSection, err, {
      cohortId: input.cohortId.trim(),
      teacherId: input.teacherId.trim(),
    });
    return { ok: false };
  }
}

export async function updateAcademicSectionScheduleAction(input: {
  locale: string;
  sectionId: string;
  scheduleSlots: SectionScheduleSlot[];
}): Promise<{ ok: true } | { ok: false }> {
  const sectionId = uuid.safeParse(input.sectionId.trim());
  const scheduleSlots = normalizeSectionScheduleSlots(input.scheduleSlots);
  if (!sectionId.success || !scheduleSlots) return { ok: false };

  try {
    const { supabase } = await assertAdmin();
    const { data: row, error } = await supabase
      .from("academic_sections")
      .update({ schedule_slots: scheduleSlots })
      .eq("id", sectionId.data)
      .select("id, cohort_id")
      .maybeSingle();

    const section = row as { id: string; cohort_id: string } | null;
    if (error || !section?.id || !section.cohort_id) {
      if (error) {
        logSupabaseClientError(S.updateSectionSchedule, error, {
          sectionId: sectionId.data,
          scheduleCount: scheduleSlots.length,
        });
      }
      return { ok: false };
    }

    void recordSystemAudit({
      action: "academic_section_schedule_updated",
      resourceType: "academic_section",
      resourceId: section.id,
      payload: {
        cohort_id: section.cohort_id,
        schedule_slots: scheduleSlots,
      },
    });

    revalidateAcademicSurfaces(input.locale);
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${section.cohort_id}`, "page");
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${section.cohort_id}/${section.id}`, "page");
    return { ok: true };
  } catch (err) {
    logServerActionException(S.updateSectionSchedule, err, {
      sectionId: input.sectionId.trim() || undefined,
    });
    return { ok: false };
  }
}
