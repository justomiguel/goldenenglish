"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";
import {
  logServerActionException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import { previewStudentAssistantScheduleConflicts } from "@/lib/academics/previewStudentAssistantScheduleConflicts";
import {
  SECTION_ASSISTANT_ELIGIBLE_ROLES,
  SECTION_LEAD_TEACHER_ELIGIBLE_ROLES,
  isProfileEligibleAsSectionAssistant,
  isProfileEligibleAsSectionLeadTeacher,
} from "@/lib/academics/sectionStaffEligibleRoles";

const uuid = z.string().uuid();
const MAX_ASSISTANTS = 30;

const S = {
  updateTeacher: "updateAcademicSectionTeacherAction",
  replaceAssistants: "replaceAcademicSectionAssistantsAction",
} as const;

export async function updateAcademicSectionTeacherAction(input: {
  locale: string;
  sectionId: string;
  teacherId: string;
}): Promise<{ ok: true } | { ok: false }> {
  const sectionId = uuid.safeParse(input.sectionId.trim());
  const teacherId = uuid.safeParse(input.teacherId.trim());
  if (!sectionId.success || !teacherId.success) return { ok: false };

  try {
    const { supabase } = await assertAdmin();

    const { data: prof, error: pErr } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", teacherId.data)
      .in("role", [...SECTION_LEAD_TEACHER_ELIGIBLE_ROLES])
      .maybeSingle();
    if (pErr || !prof?.id || !isProfileEligibleAsSectionLeadTeacher((prof as { role: string }).role)) {
      return { ok: false };
    }

    const { data: before, error: bErr } = await supabase
      .from("academic_sections")
      .select("id, cohort_id, teacher_id")
      .eq("id", sectionId.data)
      .maybeSingle();
    if (bErr || !before) {
      if (bErr) logSupabaseClientError(`${S.updateTeacher}:select`, bErr, { sectionId: sectionId.data });
      return { ok: false };
    }

    const { data: updated, error: uErr } = await supabase
      .from("academic_sections")
      .update({ teacher_id: teacherId.data })
      .eq("id", sectionId.data)
      .select("id, cohort_id, teacher_id")
      .maybeSingle();
    if (uErr || !updated) {
      if (uErr) logSupabaseClientError(`${S.updateTeacher}:update`, uErr, { sectionId: sectionId.data });
      return { ok: false };
    }

    await supabase
      .from("academic_section_assistants")
      .delete()
      .eq("section_id", sectionId.data)
      .eq("assistant_id", teacherId.data);

    void recordSystemAudit({
      action: "academic_section_teacher_updated",
      resourceType: "academic_section",
      resourceId: sectionId.data,
      payload: {
        cohort_id: (before as { cohort_id: string }).cohort_id,
        from_teacher_id: (before as { teacher_id: string }).teacher_id,
        to_teacher_id: teacherId.data,
      },
    });

    revalidateAcademicSurfaces(input.locale);
    const cohortId = (updated as { cohort_id: string }).cohort_id;
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${cohortId}`, "page");
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${cohortId}/${sectionId.data}`, "page");
    return { ok: true };
  } catch (err) {
    logServerActionException(S.updateTeacher, err, { sectionId: input.sectionId.trim() });
    return { ok: false };
  }
}

export async function replaceAcademicSectionAssistantsAction(input: {
  locale: string;
  sectionId: string;
  assistantIds: string[];
}): Promise<{ ok: true } | { ok: false; code?: "SCHEDULE_OVERLAP" }> {
  const sectionId = uuid.safeParse(input.sectionId.trim());
  if (!sectionId.success) return { ok: false };

  const rawIds = [...new Set(input.assistantIds.map((x) => x.trim()).filter(Boolean))].slice(0, MAX_ASSISTANTS);
  const parsed = z.array(uuid).safeParse(rawIds);
  if (!parsed.success) return { ok: false };

  try {
    const { supabase } = await assertAdmin();

    const { data: sec, error: sErr } = await supabase
      .from("academic_sections")
      .select("id, cohort_id, teacher_id")
      .eq("id", sectionId.data)
      .maybeSingle();
    if (sErr || !sec) {
      if (sErr) logSupabaseClientError(`${S.replaceAssistants}:section`, sErr, { sectionId: sectionId.data });
      return { ok: false };
    }
    const leadId = (sec as { teacher_id: string }).teacher_id;
    const filtered = parsed.data.filter((id) => id !== leadId);

    if (filtered.length) {
      const { data: profs, error: tErr } = await supabase
        .from("profiles")
        .select("id, role")
        .in("id", filtered)
        .in("role", [...SECTION_ASSISTANT_ELIGIBLE_ROLES]);
      if (tErr || !profs || profs.length !== filtered.length) return { ok: false };
      for (const p of profs) {
        if (!isProfileEligibleAsSectionAssistant((p as { role: string }).role)) return { ok: false };
      }
      for (const id of filtered) {
        const role = (profs as { id: string; role: string }[]).find((x) => x.id === id)?.role;
        if (role !== "student") continue;
        const pv = await previewStudentAssistantScheduleConflicts(supabase, {
          sectionId: sectionId.data,
          studentProfileId: id,
        });
        if (!pv.ok && pv.code === "SCHEDULE_OVERLAP") return { ok: false, code: "SCHEDULE_OVERLAP" };
        if (!pv.ok) return { ok: false };
      }
    }

    const { error: delErr } = await supabase
      .from("academic_section_assistants")
      .delete()
      .eq("section_id", sectionId.data);
    if (delErr) {
      logSupabaseClientError(`${S.replaceAssistants}:delete`, delErr, { sectionId: sectionId.data });
      return { ok: false };
    }

    if (filtered.length) {
      const { error: insErr } = await supabase.from("academic_section_assistants").insert(
        filtered.map((assistant_id) => ({
          section_id: sectionId.data,
          assistant_id,
        })),
      );
      if (insErr) {
        logSupabaseClientError(`${S.replaceAssistants}:insert`, insErr, {
          sectionId: sectionId.data,
          n: filtered.length,
        });
        return { ok: false };
      }
    }

    void recordSystemAudit({
      action: "academic_section_assistants_replaced",
      resourceType: "academic_section",
      resourceId: sectionId.data,
      payload: {
        cohort_id: (sec as { cohort_id: string }).cohort_id,
        assistant_ids: filtered,
      },
    });

    revalidateAcademicSurfaces(input.locale);
    const cohortId = (sec as { cohort_id: string }).cohort_id;
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${cohortId}`, "page");
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${cohortId}/${sectionId.data}`, "page");
    return { ok: true };
  } catch (err) {
    logServerActionException(S.replaceAssistants, err, { sectionId: input.sectionId.trim() });
    return { ok: false };
  }
}
