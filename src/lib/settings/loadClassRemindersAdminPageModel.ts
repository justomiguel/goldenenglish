import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { parseClassReminderSiteSettings } from "@/lib/notifications/parseClassReminderSiteSettings";
import type { ClassReminderSiteSettings } from "@/types/classReminders";

const KEYS = [
  "class_reminders_enabled",
  "class_reminder_prep_offset_minutes",
  "class_reminder_urgent_offset_minutes",
  "class_reminder_institute_tz",
  "class_reminder_whatsapp_quiet",
] as const;

export async function loadClassRemindersAdminPageModel(): Promise<ClassReminderSiteSettings | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (!isAdmin) return null;

  const { data, error } = await supabase.from("site_settings").select("key, value").in("key", [...KEYS]);
  if (error || !data) return null;
  return parseClassReminderSiteSettings(data as Record<string, unknown>[]);
}
