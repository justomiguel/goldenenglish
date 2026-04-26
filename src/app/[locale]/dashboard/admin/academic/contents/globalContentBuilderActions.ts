"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { auditLearningContentStaffAction } from "@/lib/learning-content/auditLearningContentStaffAction";
import { logServerException } from "@/lib/logging/serverActionLog";

type BuilderResult =
  | { ok: true; id: string }
  | { ok: false; code: "invalid_input" | "persist_failed" | "forbidden" };

export async function archiveGlobalContentAction(raw: unknown): Promise<BuilderResult> {
  const parsed = z.object({ locale: z.string().min(2).max(8), id: z.string().uuid() }).safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };
  try {
    const { supabase, user } = await assertAdmin();
    const { error } = await supabase
      .from("content_templates")
      .update({ archived_at: new Date().toISOString(), updated_by: user.id })
      .eq("id", parsed.data.id);
    if (error) return { ok: false, code: "persist_failed" };
    await auditLearningContentStaffAction({
      actorId: user.id,
      action: "learning_content.global_content_archived",
      resourceType: "content_templates",
      resourceId: parsed.data.id,
    });
    revalidatePath(`/${parsed.data.locale}/dashboard/admin/academic/contents`);
    return { ok: true, id: parsed.data.id };
  } catch (err) {
    logServerException("archiveGlobalContentAction", err);
    return { ok: false, code: "forbidden" };
  }
}
