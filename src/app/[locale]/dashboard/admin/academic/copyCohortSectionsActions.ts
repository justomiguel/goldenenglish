"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";
import { allocateUniqueSectionName } from "@/lib/academics/uniqueSectionNameInCohort";
import { deriveSectionPeriodForCopy } from "@/lib/academics/deriveSectionPeriodForCopy";
import { getDefaultSectionMaxStudents } from "@/lib/academics/getDefaultSectionMaxStudents";
import { logServerException } from "@/lib/logging/serverActionLog";

const uuid = z.string().uuid();

export type CopyCohortSectionsResult =
  | {
      ok: true;
      sectionsCopied: number;
      enrollmentsTransferred: number;
      enrollmentsFailed: number;
    }
  | { ok: false; code: "PARSE" | "SAME_COHORT" | "EMPTY_SOURCE" | "SAVE" };

async function transferEnrollmentToNewSection(
  supabase: SupabaseClient,
  input: {
    studentId: string;
    targetSectionId: string;
    sourceEnrollmentId: string;
  },
): Promise<boolean> {
  const defMax = getDefaultSectionMaxStudents();
  const { data, error } = await supabase.rpc("academic_admin_section_enroll_commit", {
    p_student_id: input.studentId,
    p_section_id: input.targetSectionId,
    p_drop_section_enrollment_id: input.sourceEnrollmentId,
    p_drop_next_status: "transferred",
    p_allow_capacity_override: true,
    p_default_max_students: defMax,
  });
  if (error) return false;
  const row = data as { enrollment_id?: string } | null;
  return Boolean(row?.enrollment_id);
}

/**
 * Duplicates `academic_sections` from source cohort to target. Optionally moves
 * active enrollments from each source section to the matching new section (same RPC
 * as admin enroll with drop → `transferred` on the old row). Does not copy attendance
 * or grades.
 */
export async function copyCohortSectionStructureAction(input: {
  locale: string;
  sourceCohortId: string;
  targetCohortId: string;
  includeStudents?: boolean;
}): Promise<CopyCohortSectionsResult> {
  try {
    const { supabase } = await assertAdmin();
    const src = uuid.safeParse(input.sourceCohortId.trim());
    const tgt = uuid.safeParse(input.targetCohortId.trim());
    if (!src.success || !tgt.success) return { ok: false, code: "PARSE" };
    if (src.data === tgt.data) return { ok: false, code: "SAME_COHORT" };

    const [{ data: srcCohort }, { data: tgtCohort }] = await Promise.all([
      supabase.from("academic_cohorts").select("id, archived_at").eq("id", src.data).maybeSingle(),
      supabase.from("academic_cohorts").select("id, archived_at").eq("id", tgt.data).maybeSingle(),
    ]);
    const srcArch = (srcCohort as { archived_at?: string | null } | null)?.archived_at;
    const tgtArch = (tgtCohort as { archived_at?: string | null } | null)?.archived_at;
    if (!srcCohort || !tgtCohort || srcArch != null || tgtArch != null) {
      return { ok: false, code: "SAVE" };
    }

    const { data: sourceRows, error: srcErr } = await supabase
      .from("academic_sections")
      .select("id, name, teacher_id, schedule_slots, max_students, starts_on, ends_on")
      .eq("cohort_id", src.data)
      .is("archived_at", null)
      .order("created_at", { ascending: true });

    if (srcErr) return { ok: false, code: "SAVE" };
    if (!sourceRows?.length) return { ok: false, code: "EMPTY_SOURCE" };

    const { data: existingTarget } = await supabase
      .from("academic_sections")
      .select("name")
      .eq("cohort_id", tgt.data);

    const taken = new Set(
      (existingTarget ?? []).map((r) => String((r as { name: string }).name)),
    );

    const pairs: { sourceId: string; targetId: string }[] = [];

    for (const row of sourceRows) {
      const r = row as {
        id: string;
        name: string;
        teacher_id: string;
        schedule_slots: unknown;
        max_students: number | null;
        starts_on?: string | null;
        ends_on?: string | null;
      };
      const name = allocateUniqueSectionName(r.name, taken);
      const { starts_on, ends_on } = deriveSectionPeriodForCopy({
        sourceStartsOn: r.starts_on ?? null,
        sourceEndsOn: r.ends_on ?? null,
      });
      const { data: inserted, error } = await supabase
        .from("academic_sections")
        .insert({
          cohort_id: tgt.data,
          name,
          teacher_id: r.teacher_id,
          schedule_slots: r.schedule_slots ?? [],
          max_students: r.max_students,
          starts_on,
          ends_on,
        })
        .select("id")
        .single();

      if (error || !inserted?.id) return { ok: false, code: "SAVE" };
      pairs.push({ sourceId: r.id, targetId: inserted.id as string });
    }

    for (const { sourceId, targetId } of pairs) {
      const { data: asstRows, error: asErr } = await supabase
        .from("academic_section_assistants")
        .select("assistant_id")
        .eq("section_id", sourceId);
      if (asErr || !asstRows?.length) continue;
      const { error: insAsErr } = await supabase.from("academic_section_assistants").insert(
        asstRows.map((row) => ({
          section_id: targetId,
          assistant_id: (row as { assistant_id: string }).assistant_id,
        })),
      );
      if (insAsErr) return { ok: false, code: "SAVE" };

      const { data: extRows, error: exErr } = await supabase
        .from("academic_section_external_assistants")
        .select("display_name")
        .eq("section_id", sourceId);
      if (!exErr && extRows?.length) {
        const { error: insExErr } = await supabase.from("academic_section_external_assistants").insert(
          extRows.map((row) => ({
            section_id: targetId,
            display_name: (row as { display_name: string }).display_name,
          })),
        );
        if (insExErr) return { ok: false, code: "SAVE" };
      }
    }

    let enrollmentsTransferred = 0;
    let enrollmentsFailed = 0;

    if (input.includeStudents) {
      for (const { sourceId, targetId } of pairs) {
        const { data: enrs, error: enrErr } = await supabase
          .from("section_enrollments")
          .select("id, student_id")
          .eq("section_id", sourceId)
          .eq("status", "active");

        if (enrErr) return { ok: false, code: "SAVE" };

        for (const raw of enrs ?? []) {
          const e = raw as { id: string; student_id: string };
          const ok = await transferEnrollmentToNewSection(supabase, {
            studentId: e.student_id,
            targetSectionId: targetId,
            sourceEnrollmentId: e.id,
          });
          if (ok) enrollmentsTransferred += 1;
          else enrollmentsFailed += 1;
        }
      }
    }

    void recordSystemAudit({
      action: "academic_cohort_section_structure_copied",
      resourceType: "academic_cohort",
      resourceId: tgt.data,
      payload: {
        source_cohort_id: src.data,
        sections_copied: pairs.length,
        include_students: Boolean(input.includeStudents),
        enrollments_transferred: enrollmentsTransferred,
        enrollments_failed: enrollmentsFailed,
      },
    });

    revalidateAcademicSurfaces(input.locale);
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${tgt.data}`, "page");
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${src.data}`, "page");
    return {
      ok: true,
      sectionsCopied: pairs.length,
      enrollmentsTransferred,
      enrollmentsFailed,
    };
  } catch (err) {
    logServerException("copyCohortSectionStructureAction", err);
    return { ok: false, code: "SAVE" };
  }
}
