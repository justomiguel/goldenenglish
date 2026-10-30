"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { ADMIN_SESSION_FORBIDDEN, ADMIN_SESSION_UNAUTHORIZED } from "@/lib/dashboard/adminSessionErrors";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { findAuthUserIdByNormalizedEmail } from "@/lib/supabase/findAuthUserIdByNormalizedEmail";
import { logServerActionException, logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";

const Schema = z.object({
  locale: z.string().min(2).max(8),
  courseId: z.string().uuid(),
  sectionId: z.string().uuid(),
});

export type AssignCourseResult = { ok: true } | { ok: false; code: "unauthorized" | "invalid_input" | "persist_failed" };

export async function assignCourseToSectionAction(raw: unknown): Promise<AssignCourseResult> {
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    const { supabase, user } = await assertAdmin();
    const { error } = await supabase.from("section_course_assignments").insert({
      section_id: parsed.data.sectionId,
      course_id: parsed.data.courseId,
      created_by: user.id,
    });
    if (error && error.code !== "23505") {
      logSupabaseClientError("assignCourseToSection", error, { courseId: parsed.data.courseId });
      return { ok: false, code: "persist_failed" };
    }
    await recordSystemAudit({
      action: "course.assign_section",
      resourceType: "learning_course",
      resourceId: parsed.data.courseId,
      payload: { section_id: parsed.data.sectionId },
    });
    revalidateAcademicSurfaces(parsed.data.locale);
    revalidatePath(`/${parsed.data.locale}/dashboard/student/progress`);
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && (error.message === ADMIN_SESSION_UNAUTHORIZED || error.message === ADMIN_SESSION_FORBIDDEN)) {
      logServerAuthzDenied("assignCourseToSection", { reason: error.message });
      return { ok: false, code: "unauthorized" };
    }
    logServerActionException("assignCourseToSection", error);
    return { ok: false, code: "persist_failed" };
  }
}

const GrantSchema = z.object({
  locale: z.string().min(2).max(8),
  courseId: z.string().uuid(),
  email: z.string().trim().email().max(200),
});

export async function grantCourseToStudentAction(raw: unknown): Promise<AssignCourseResult> {
  const parsed = GrantSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    const { supabase, user } = await assertAdmin();
    const admin = await createAdminClient();
    const found = await findAuthUserIdByNormalizedEmail(admin, parsed.data.email.trim().toLowerCase());
    if (found.error || !found.userId) {
      if (found.error) logSupabaseClientError("grantCourseToStudent:lookup", found.error, {});
      return { ok: false, code: "persist_failed" };
    }
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, role")
      .eq("id", found.userId)
      .maybeSingle();
    if (profileError || !profile || profile.role !== "student") {
      if (profileError) logSupabaseClientError("grantCourseToStudent:profile", profileError, {});
      return { ok: false, code: "invalid_input" };
    }
    const { error } = await supabase.from("student_course_grants").upsert(
      {
        student_id: profile.id,
        course_id: parsed.data.courseId,
        source: "admin",
        created_by: user.id,
      },
      { onConflict: "student_id,course_id", ignoreDuplicates: true },
    );
    if (error) {
      logSupabaseClientError("grantCourseToStudent:grant", error, { courseId: parsed.data.courseId });
      return { ok: false, code: "persist_failed" };
    }
    await recordSystemAudit({
      action: "course.grant_student",
      resourceType: "learning_course",
      resourceId: parsed.data.courseId,
      payload: { student_id: profile.id },
    });
    revalidateAcademicSurfaces(parsed.data.locale);
    revalidatePath(`/${parsed.data.locale}/dashboard/student/progress`);
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && (error.message === ADMIN_SESSION_UNAUTHORIZED || error.message === ADMIN_SESSION_FORBIDDEN)) {
      logServerAuthzDenied("grantCourseToStudent", { reason: error.message });
      return { ok: false, code: "unauthorized" };
    }
    logServerActionException("grantCourseToStudent", error);
    return { ok: false, code: "persist_failed" };
  }
}
