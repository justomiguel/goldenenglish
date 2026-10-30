import "server-only";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import {
  logServerAuthzDenied,
  logServerException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

const KEYS = [
  "blog_enabled",
  "blog_comments_enabled",
  "blog_guest_comments_enabled",
] as const;

export async function saveBlogSettings(
  supabase: SupabaseClient,
  input: {
    actorId: string;
    canConfigure: boolean;
    blogEnabled: boolean;
    commentsEnabled: boolean;
    guestCommentsEnabled: boolean;
    locale: string;
  },
): Promise<{ ok: true } | { ok: false; code: "forbidden" | "save_failed" }> {
  if (!input.canConfigure) {
    logServerAuthzDenied("blog.saveSettings", { actorId: input.actorId });
    return { ok: false, code: "forbidden" };
  }

  const updatedAt = new Date().toISOString();
  const values = [input.blogEnabled, input.commentsEnabled, input.guestCommentsEnabled];
  const { error } = await supabase.from("site_settings").upsert(
    KEYS.map((key, index) => ({
      key,
      value: values[index],
      updated_at: updatedAt,
    })),
    { onConflict: "key" },
  );
  if (error) {
    logSupabaseClientError("blog.saveSettings", error, { actorId: input.actorId });
    return { ok: false, code: "save_failed" };
  }

  try {
    await recordSystemAudit({
      action: "blog.settings_update",
      resourceType: "site_settings",
      payload: {
        blog_enabled: input.blogEnabled,
        blog_comments_enabled: input.commentsEnabled,
        blog_guest_comments_enabled: input.guestCommentsEnabled,
      },
    });
  } catch (error) {
    logServerException("blog.saveSettings.audit", error, { actorId: input.actorId });
  }

  revalidatePath(`/${input.locale}/dashboard/admin/cms/blog`);
  revalidatePath(`/${input.locale}/blog`);
  return { ok: true };
}
