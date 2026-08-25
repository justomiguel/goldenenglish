import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { parseClassReminderSiteSettings } from "@/lib/notifications/parseClassReminderSiteSettings";
import { listEmailTemplateDefinitions } from "@/lib/email/templates/templateRegistry";
import {
  CLASS_REMINDERS_ENABLED_KEY,
  EMAIL_SENDS_ENABLED_KEY,
  parseEmailSendsEnabled,
} from "@/lib/email/emailSendsEnabled";
import {
  buildEmailSendsAdminGroups,
  type EmailSendsAdminGroup,
} from "@/lib/email/buildEmailSendsAdminGroups";
import type { Locale } from "@/types/i18n";

export async function loadEmailSendsAdminPageModel(
  locale: Locale,
  overrides: { inactivity: string; classReminder: string },
): Promise<{
  groups: EmailSendsAdminGroup[];
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (!isAdmin) return null;

  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", [EMAIL_SENDS_ENABLED_KEY, CLASS_REMINDERS_ENABLED_KEY]);
  const rows = !error && data ? (data as { key: string; value: unknown }[]) : [];
  const sendsRow = rows.find((r) => r.key === EMAIL_SENDS_ENABLED_KEY);
  return {
    groups: buildEmailSendsAdminGroups(
      listEmailTemplateDefinitions(),
      parseEmailSendsEnabled(sendsRow?.value),
      parseClassReminderSiteSettings(rows).remindersEnabled,
      locale,
      overrides,
    ),
  };
}
