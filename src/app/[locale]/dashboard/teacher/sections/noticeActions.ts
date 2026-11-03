"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertTeacher } from "@/lib/dashboard/assertTeacher";
import { logServerActionException, logServerAuthzDenied, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { auditLearningTaskStaffAction, staffCanManageLearningSection } from "@/lib/learning-tasks";
import { parsePlainText } from "@/lib/learning-tasks/plainText";

type NoticeResult = { ok: true } | { ok: false; code: "unauthorized" | "forbidden" | "invalid_input" | "limit" | "persist_failed" };

const PublishSchema = z.object({
  locale: z.string().min(2).max(8),
  sectionId: z.string().uuid(),
  body: z.string(),
});

const ArchiveSchema = z.object({
  locale: z.string().min(2).max(8),
  sectionId: z.string().uuid(),
  noticeId: z.string().uuid(),
});

async function guard(sectionId: string) {
  const { supabase, user } = await assertTeacher();
  const canManage = await staffCanManageLearningSection(supabase, user.id, sectionId);
  return { supabase, user, canManage };
}

export async function publishSectionNoticeAction(raw: unknown): Promise<NoticeResult> {
  const parsed = PublishSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  const body = parsePlainText(parsed.data.body, 500);
  if (!body.ok) return { ok: false, code: "invalid_input" };

  try {
    const { supabase, user, canManage } = await guard(parsed.data.sectionId);
    if (!canManage) {
      logServerAuthzDenied("publishSectionNoticeAction", { sectionId: parsed.data.sectionId });
      return { ok: false, code: "forbidden" };
    }
    const { count, error: countError } = await supabase
      .from("section_notices")
      .select("id", { count: "exact", head: true })
      .eq("section_id", parsed.data.sectionId)
      .is("archived_at", null);
    if (countError) {
      logSupabaseClientError("publishSectionNoticeAction:count", countError, { sectionId: parsed.data.sectionId });
      return { ok: false, code: "persist_failed" };
    }
    if ((count ?? 0) >= 5) return { ok: false, code: "limit" };

    const { data, error } = await supabase
      .from("section_notices")
      .insert({ section_id: parsed.data.sectionId, author_id: user.id, body_text: body.text })
      .select("id")
      .single();
    if (error || !data) {
      if (error) logSupabaseClientError("sectionNotices.publish", error, { sectionId: parsed.data.sectionId });
      return { ok: false, code: "persist_failed" };
    }
    await auditLearningTaskStaffAction({
      actorId: user.id,
      action: "section_notice.published",
      resourceType: "section_notices",
      resourceId: (data as { id: string }).id,
      payload: { sectionId: parsed.data.sectionId },
    });
    revalidatePath(`/${parsed.data.locale}/dashboard/teacher/sections/${parsed.data.sectionId}`);
    revalidatePath(`/${parsed.data.locale}/dashboard/student`);
    revalidatePath(`/${parsed.data.locale}/dashboard/parent`);
    return { ok: true };
  } catch (error) {
    logServerActionException("publishSectionNoticeAction", error);
    return { ok: false, code: "persist_failed" };
  }
}

export async function archiveSectionNoticeAction(raw: unknown): Promise<NoticeResult> {
  const parsed = ArchiveSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    const { supabase, user, canManage } = await guard(parsed.data.sectionId);
    if (!canManage) return { ok: false, code: "forbidden" };
    const { error } = await supabase
      .from("section_notices")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", parsed.data.noticeId)
      .eq("section_id", parsed.data.sectionId)
      .is("archived_at", null);
    if (error) {
      logSupabaseClientError("archiveSectionNoticeAction", error, { noticeId: parsed.data.noticeId });
      return { ok: false, code: "persist_failed" };
    }
    await auditLearningTaskStaffAction({
      actorId: user.id,
      action: "section_notice.archived",
      resourceType: "section_notices",
      resourceId: parsed.data.noticeId,
      payload: { sectionId: parsed.data.sectionId },
    });
    revalidatePath(`/${parsed.data.locale}/dashboard/teacher/sections/${parsed.data.sectionId}`);
    revalidatePath(`/${parsed.data.locale}/dashboard/student`);
    revalidatePath(`/${parsed.data.locale}/dashboard/parent`);
    return { ok: true };
  } catch (error) {
    logServerActionException("archiveSectionNoticeAction", error);
    return { ok: false, code: "persist_failed" };
  }
}
