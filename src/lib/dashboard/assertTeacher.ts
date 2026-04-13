import { createClient } from "@/lib/supabase/server";

const FORBIDDEN = "TEACHER_SESSION_FORBIDDEN";
const UNAUTH = "TEACHER_SESSION_UNAUTHORIZED";

export async function assertTeacher() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error(UNAUTH);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile || profile.role !== "teacher") {
    throw new Error(FORBIDDEN);
  }

  return { supabase, user, profileId: profile.id as string };
}
