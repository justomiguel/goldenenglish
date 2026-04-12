import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";

export async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (!isAdmin) throw new Error("Forbidden");
  return { supabase, user };
}
