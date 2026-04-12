import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";

export async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error(ADMIN_SESSION_UNAUTHORIZED);

  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (!isAdmin) throw new Error(ADMIN_SESSION_FORBIDDEN);
  return { supabase, user };
}
