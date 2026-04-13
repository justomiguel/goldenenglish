"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertTeacher } from "@/lib/dashboard/assertTeacher";

const uuid = z.string().uuid();

const gradePayload = z.object({
  locale: z.string().min(1),
  sectionId: uuid,
  enrollmentId: uuid,
  assessmentName: z.string().min(1).max(200),
  score: z.coerce.number().min(0).max(10),
  feedback: z.string().max(4000).optional().nullable(),
  rubric: z.record(z.string(), z.coerce.number().min(1).max(5)).optional(),
});

export type SectionGradeSubmitState = { ok: true } | { ok: false; code: "auth" | "validation" | "forbidden" | "save" };

async function verifyTeacherSection(
  supabase: Awaited<ReturnType<typeof assertTeacher>>["supabase"],
  teacherId: string,
  sectionId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("academic_sections")
    .select("id")
    .eq("id", sectionId)
    .eq("teacher_id", teacherId)
    .maybeSingle();
  return Boolean(data);
}

async function verifyEnrollment(
  supabase: Awaited<ReturnType<typeof assertTeacher>>["supabase"],
  sectionId: string,
  enrollmentId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("section_enrollments")
    .select("id")
    .eq("id", enrollmentId)
    .eq("section_id", sectionId)
    .maybeSingle();
  return Boolean(data);
}

export async function submitSectionGradeAction(
  _prev: SectionGradeSubmitState | null,
  formData: FormData,
): Promise<SectionGradeSubmitState> {
  try {
    const { supabase, profileId } = await assertTeacher();
    const raw = formData.get("payload");
    const parsed = gradePayload.safeParse(JSON.parse(typeof raw === "string" ? raw : "{}"));
    if (!parsed.success) return { ok: false, code: "validation" };

    const p = parsed.data;
    const owns = await verifyTeacherSection(supabase, profileId, p.sectionId);
    if (!owns) return { ok: false, code: "forbidden" };
    const enrOk = await verifyEnrollment(supabase, p.sectionId, p.enrollmentId);
    if (!enrOk) return { ok: false, code: "forbidden" };

    const rubric_data = p.rubric ?? {};
    const { error } = await supabase.from("section_grades").insert({
      enrollment_id: p.enrollmentId,
      assessment_name: p.assessmentName.trim(),
      score: p.score,
      feedback_text: p.feedback?.trim() ? p.feedback.trim() : null,
      rubric_data,
      recorded_by: profileId,
    });
    if (error) return { ok: false, code: "save" };

    revalidatePath(`/${p.locale}/dashboard/teacher/sections/${p.sectionId}/grades`);
    revalidatePath(`/${p.locale}/dashboard/student`);
    revalidatePath(`/${p.locale}/dashboard/parent`);
    return { ok: true };
  } catch {
    return { ok: false, code: "auth" };
  }
}
