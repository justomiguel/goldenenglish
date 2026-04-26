"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertTeacher } from "@/lib/dashboard/assertTeacher";
import { logServerException } from "@/lib/logging/serverActionLog";
import { staffCanManageLearningSection } from "@/lib/learning-tasks/staffAccess";
import { resolveReadinessDecision } from "@/lib/learning-content";
import { auditLearningContentStaffAction } from "@/lib/learning-content/auditLearningContentStaffAction";

type ReviewAttemptResult =
  | { ok: true; id: string }
  | { ok: false; code: "invalid_input" | "forbidden" | "not_found" | "persist_failed" };

const ReviewAttemptSchema = z.object({
  locale: z.string().min(2).max(8),
  sectionId: z.string().uuid(),
  attemptId: z.string().uuid(),
  studentId: z.string().uuid(),
  score: z.coerce.number().min(0).max(100).optional(),
  passed: z.boolean().nullable().default(null),
  teacherFeedback: z.string().trim().max(4000).optional(),
  teacherApproved: z.boolean(),
});

export async function reviewAssessmentAttemptAction(raw: unknown): Promise<ReviewAttemptResult> {
  const parsed = ReviewAttemptSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    const { supabase, user } = await assertTeacher();
    const allowed = await staffCanManageLearningSection(supabase, user.id, parsed.data.sectionId);
    if (!allowed) return { ok: false, code: "forbidden" };

    const readinessStatus = resolveReadinessDecision({
      teacherApproved: parsed.data.teacherApproved,
      failedAttempt: parsed.data.passed === false,
    });
    const { error: attemptError } = await supabase
      .from("student_assessment_attempts")
      .update({
        score: parsed.data.score ?? null,
        passed: parsed.data.passed,
        teacher_feedback: parsed.data.teacherFeedback ?? "",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        status: "reviewed",
      })
      .eq("id", parsed.data.attemptId)
      .eq("student_id", parsed.data.studentId);
    if (attemptError) return { ok: false, code: "persist_failed" };

    const { data, error } = await supabase
      .from("student_learning_readiness")
      .upsert(
        {
          student_id: parsed.data.studentId,
          section_id: parsed.data.sectionId,
          assessment_attempt_id: parsed.data.attemptId,
          readiness_status: readinessStatus,
          reason: parsed.data.teacherFeedback ?? "",
          set_by: user.id,
        },
        { onConflict: "student_id,section_id" },
      )
      .select("id")
      .single();
    if (error || !data) return { ok: false, code: "persist_failed" };
    await auditLearningContentStaffAction({
      actorId: user.id,
      action: "learning_content.assessment_attempt_reviewed",
      resourceType: "student_assessment_attempts",
      resourceId: parsed.data.attemptId,
      payload: {
        sectionId: parsed.data.sectionId,
        studentId: parsed.data.studentId,
        readinessStatus,
        passed: parsed.data.passed,
      },
    });
    revalidatePath(`/${parsed.data.locale}/dashboard/teacher/sections/${parsed.data.sectionId}/contents`);
    revalidatePath(`/${parsed.data.locale}/dashboard/student`);
    return { ok: true, id: (data as { id: string }).id };
  } catch (err) {
    logServerException("reviewAssessmentAttemptAction", err);
    return { ok: false, code: "forbidden" };
  }
}
