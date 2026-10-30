import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const KEYS = ["blog_enabled", "blog_comments_enabled", "blog_guest_comments_enabled"] as const;

function readFlag(value: unknown, missing: boolean): boolean {
  if (value === undefined || value === null) return missing;
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() !== "false";
}

export async function loadBlogHubSettings(): Promise<{
  blogEnabled: boolean;
  commentsEnabled: boolean;
  guestCommentsEnabled: boolean;
}> {
  const admin = await createAdminClient();
  const { data } = await admin.from("site_settings").select("key, value").in("key", [...KEYS]);
  const byKey = new Map((data ?? []).map((row) => [row.key, row.value]));
  return {
    blogEnabled: readFlag(byKey.get("blog_enabled"), true),
    commentsEnabled: readFlag(byKey.get("blog_comments_enabled"), true),
    guestCommentsEnabled: readFlag(byKey.get("blog_guest_comments_enabled"), false),
  };
}
