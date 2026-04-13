"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";

const uuid = z.string().uuid();


export async function setCurrentCohortAction(input: {
  cohortId: string;
  locale: string;
}): Promise<{ ok: true } | { ok: false }> {
  try {
    const { supabase } = await assertAdmin();
    const id = input.cohortId.trim();
    if (!id) return { ok: false };

    const { error: clearErr } = await supabase
      .from("academic_cohorts")
      .update({ is_current: false })
      .eq("is_current", true);
    if (clearErr) return { ok: false };

    const { error: setErr } = await supabase
      .from("academic_cohorts")
      .update({ is_current: true })
      .eq("id", id);
    if (setErr) return { ok: false };

    void recordSystemAudit({
      action: "academic_cohort_set_current",
      resourceType: "academic_cohort",
      resourceId: id,
      payload: {},
    });

    revalidateAcademicSurfaces(input.locale);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function createAcademicCohortAction(input: {
  locale: string;
  name: string;
  slug?: string | null;
}): Promise<{ ok: true; id: string } | { ok: false }> {
  try {
    const { supabase } = await assertAdmin();
    const name = input.name.trim();
    if (name.length < 2) return { ok: false };

    const slug = input.slug?.trim() || null;
    const { data, error } = await supabase
      .from("academic_cohorts")
      .insert({
        name,
        slug: slug || null,
      })
      .select("id")
      .single();

    if (error || !data?.id) return { ok: false };

    void recordSystemAudit({
      action: "academic_cohort_created",
      resourceType: "academic_cohort",
      resourceId: data.id as string,
      payload: { name },
    });

    revalidateAcademicSurfaces(input.locale);
    return { ok: true, id: data.id as string };
  } catch {
    return { ok: false };
  }
}

export async function createAcademicSectionAction(input: {
  locale: string;
  cohortId: string;
  name: string;
  teacherId: string;
  maxStudents?: number | null;
}): Promise<{ ok: true; id: string } | { ok: false }> {
  try {
    const { supabase } = await assertAdmin();
    const cohortId = uuid.safeParse(input.cohortId.trim());
    const teacherId = uuid.safeParse(input.teacherId.trim());
    if (!cohortId.success || !teacherId.success) return { ok: false };

    const name = input.name.trim();
    if (name.length < 2) return { ok: false };

    const { data: cohort } = await supabase
      .from("academic_cohorts")
      .select("id")
      .eq("id", cohortId.data)
      .maybeSingle();
    if (!cohort?.id) return { ok: false };

    const { data: teacher } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", teacherId.data)
      .maybeSingle();
    if (!teacher || (teacher as { role: string }).role !== "teacher") {
      return { ok: false };
    }

    let maxStudents: number | null = null;
    if (input.maxStudents != null && Number.isFinite(input.maxStudents)) {
      const n = Math.floor(Number(input.maxStudents));
      if (n > 0) maxStudents = n;
    }

    const { data: row, error } = await supabase
      .from("academic_sections")
      .insert({
        cohort_id: cohortId.data,
        name,
        teacher_id: teacherId.data,
        schedule_slots: [],
        max_students: maxStudents,
      })
      .select("id")
      .single();

    if (error || !row?.id) return { ok: false };

    void recordSystemAudit({
      action: "academic_section_created",
      resourceType: "academic_section",
      resourceId: row.id as string,
      payload: { cohort_id: cohortId.data, name, teacher_id: teacherId.data },
    });

    revalidateAcademicSurfaces(input.locale);
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${cohortId.data}`, "page");
    return { ok: true, id: row.id as string };
  } catch {
    return { ok: false };
  }
}

export type AdminStudentSearchHit = {
  id: string;
  label: string;
  role: string;
};

export type SectionStudentPick = {
  enrollmentId: string;
  studentId: string;
  label: string;
};

export async function listActiveStudentsInSectionForAdmin(
  sectionId: string,
): Promise<SectionStudentPick[]> {
  try {
    const { supabase } = await assertAdmin();
    const sid = sectionId.trim();
    if (!sid) return [];

    const { data, error } = await supabase
      .from("section_enrollments")
      .select("id, student_id, profiles(first_name,last_name)")
      .eq("section_id", sid)
      .eq("status", "active");

    if (error || !data) return [];

    return data.map((row) => {
      const r = row as {
        id: string;
        student_id: string;
        profiles: { first_name: string; last_name: string } | { first_name: string; last_name: string }[] | null;
      };
      const pRaw = r.profiles;
      const p = Array.isArray(pRaw) ? (pRaw[0] ?? null) : pRaw;
      const label = p ? `${p.first_name} ${p.last_name}`.trim() : r.student_id;
      return { enrollmentId: r.id, studentId: r.student_id, label };
    });
  } catch {
    return [];
  }
}

export async function searchAdminStudentsAction(query: string): Promise<AdminStudentSearchHit[]> {
  try {
    const { supabase } = await assertAdmin();
    const q = query.trim();
    if (q.length < 2) return [];

    const pat = `%${q}%`;
    const [r1, r2, r3] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, first_name, last_name, role")
        .eq("role", "student")
        .ilike("first_name", pat)
        .limit(6),
      supabase
        .from("profiles")
        .select("id, first_name, last_name, role")
        .eq("role", "student")
        .ilike("last_name", pat)
        .limit(6),
      supabase
        .from("profiles")
        .select("id, first_name, last_name, role")
        .eq("role", "student")
        .ilike("dni_or_passport", pat)
        .limit(6),
    ]);

    const map = new Map<string, AdminStudentSearchHit>();
    for (const r of [r1, r2, r3]) {
      if (r.error || !r.data) continue;
      for (const p of r.data) {
        map.set(p.id as string, {
          id: p.id as string,
          label: `${p.first_name} ${p.last_name}`.trim(),
          role: p.role as string,
        });
      }
    }
    return [...map.values()].slice(0, 12);
  } catch {
    return [];
  }
}
