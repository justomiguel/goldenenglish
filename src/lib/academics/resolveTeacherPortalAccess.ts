import type { SupabaseClient } from "@supabase/supabase-js";
import { getTeacherPortalAllowedRoles } from "@/lib/academics/getTeacherPortalAllowedRoles";
import { loadTeacherSectionIdsForUser } from "@/lib/academics/loadTeacherSectionIdsForUser";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";

/**
 * Who may open the teacher dashboard shell and teacher routes guarded by the layout.
 * - Profile role in configured portal roles (default: teacher)
 * - Student with at least one assistant/section teaching row
 * - Any profile role with lead teacher or assistant rows on sections (e.g. admin who teaches)
 * - Current admin session (institution staff) so admins can switch to the teaching workspace
 */
export async function resolveTeacherPortalAccess(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ allowed: boolean; profileRole: string | null }> {
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  const role = (profile?.role as string | null) ?? null;
  const allowedRoles = getTeacherPortalAllowedRoles();
  if (role && allowedRoles.includes(role)) return { allowed: true, profileRole: role };
  if (role === "student") {
    const ids = await loadTeacherSectionIdsForUser(supabase, userId);
    return { allowed: ids.length > 0, profileRole: role };
  }

  const sectionIds = await loadTeacherSectionIdsForUser(supabase, userId);
  if (sectionIds.length > 0) return { allowed: true, profileRole: role };

  const isAdmin = await resolveIsAdminSession(supabase, userId);
  if (isAdmin) return { allowed: true, profileRole: role };

  return { allowed: false, profileRole: role };
}
