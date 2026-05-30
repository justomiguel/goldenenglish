import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function loadBlogEnabled(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "blog_enabled")
    .maybeSingle();

  if (!data?.value) return true;
  if (typeof data.value === "boolean") return data.value;
  return String(data.value).toLowerCase() !== "false";
}
