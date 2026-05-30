import { createClient } from "@/lib/supabase/server";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";

export type BlogAuthorRole = "admin" | "assistant" | "teacher";

export async function assertBlogAuthor() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error(ADMIN_SESSION_UNAUTHORIZED);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile?.role) throw new Error(ADMIN_SESSION_FORBIDDEN);
  const role = String(profile.role) as BlogAuthorRole | string;
  if (role !== "admin" && role !== "assistant" && role !== "teacher") {
    throw new Error(ADMIN_SESSION_FORBIDDEN);
  }

  return {
    supabase,
    user,
    role: role as BlogAuthorRole,
  };
}
