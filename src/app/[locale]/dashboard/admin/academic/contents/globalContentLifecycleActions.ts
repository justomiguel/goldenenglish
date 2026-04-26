"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { auditLearningContentStaffAction } from "@/lib/learning-content/auditLearningContentStaffAction";
import { logServerException } from "@/lib/logging/serverActionLog";
import { LEARNING_TASK_ASSET_BUCKET } from "@/lib/learning-tasks";

type LifecycleResult =
  | { ok: true; id: string }
  | { ok: false; code: "invalid_input" | "persist_failed" | "forbidden" };

type DeleteImpactResult =
  | { ok: true; routeStepCount: number }
  | { ok: false; code: "invalid_input" | "persist_failed" | "forbidden" };

const ContentIdSchema = z.object({
  locale: z.string().min(2).max(8),
  id: z.string().uuid(),
});

export async function getGlobalContentDeleteImpactAction(raw: unknown): Promise<DeleteImpactResult> {
  const parsed = ContentIdSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  try {
    const { supabase } = await assertAdmin();
    const { count, error } = await supabase
      .from("learning_route_steps")
      .select("id", { count: "exact", head: true })
      .eq("content_template_id", parsed.data.id);
    if (error) return { ok: false, code: "persist_failed" };
    return { ok: true, routeStepCount: count ?? 0 };
  } catch (err) {
    logServerException("getGlobalContentDeleteImpactAction", err);
    return { ok: false, code: "forbidden" };
  }
}

export async function deleteGlobalContentAction(raw: unknown): Promise<LifecycleResult> {
  const parsed = ContentIdSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  try {
    const { supabase, user } = await assertAdmin();
    const { data: assets } = await supabase
      .from("content_template_assets")
      .select("storage_path")
      .eq("template_id", parsed.data.id);

    const { data: routeSteps, error: routeStepsError } = await supabase
      .from("learning_route_steps")
      .select("id")
      .eq("content_template_id", parsed.data.id);
    if (routeStepsError) return { ok: false, code: "persist_failed" };

    const { error } = await supabase
      .from("content_templates")
      .delete()
      .eq("id", parsed.data.id);

    if (error) return { ok: false, code: "persist_failed" };

    const storagePaths = ((assets ?? []) as { storage_path: string | null }[])
      .flatMap((asset) => asset.storage_path ? [asset.storage_path] : []);
    if (storagePaths.length > 0) {
      await supabase.storage.from(LEARNING_TASK_ASSET_BUCKET).remove(storagePaths);
    }

    await auditLearningContentStaffAction({
      actorId: user.id,
      action: "learning_content.global_content_deleted",
      resourceType: "content_templates",
      resourceId: parsed.data.id,
      payload: {
        removedStorageObjects: storagePaths.length,
        removedRouteSteps: ((routeSteps ?? []) as { id: string }[]).length,
      },
    });
    revalidatePath(`/${parsed.data.locale}/dashboard/admin/academic/contents`);
    return { ok: true, id: parsed.data.id };
  } catch (err) {
    logServerException("deleteGlobalContentAction", err);
    return { ok: false, code: "forbidden" };
  }
}
