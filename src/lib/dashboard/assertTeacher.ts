import { createClient } from "@/lib/supabase/server";
import { resolveTeacherPortalAccess } from "@/lib/academics/resolveTeacherPortalAccess";
import { assertNotViewAs } from "@/lib/dashboard/assertNotViewAs";

const FORBIDDEN = "TEACHER_SESSION_FORBIDDEN";
const UNAUTH = "TEACHER_SESSION_UNAUTHORIZED";

/** Session may be teacher, dedicated assistant role, or a student with at least one section assistantship. */
export async function assertTeacher() {
  const viewAsGate = await assertNotViewAs();
  if (!viewAsGate.ok) throw new Error(FORBIDDEN);

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

  if (error || !profile?.id) throw new Error(FORBIDDEN);

  const { allowed } = await resolveTeacherPortalAccess(supabase, user.id);
  if (!allowed) throw new Error(FORBIDDEN);

  return { supabase, user, profileId: profile.id as string };
}
