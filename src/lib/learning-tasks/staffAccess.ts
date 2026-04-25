import type { SupabaseClient } from "@supabase/supabase-js";
import { userIsSectionTeacherOrAssistant } from "@/lib/academics/userIsSectionTeacherOrAssistant";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";

export async function staffCanManageLearningSection(
  supabase: SupabaseClient,
  userId: string,
  sectionId: string,
): Promise<boolean> {
  if (await resolveIsAdminSession(supabase, userId)) return true;
  return userIsSectionTeacherOrAssistant(supabase, userId, sectionId);
}
