export type ClassReminderChannelPrefsRow = {
  email_class_prep: boolean;
  in_app_class_urgent: boolean;
  whatsapp_class_urgent: boolean;
  whatsapp_opt_in_at: string | null;
  whatsapp_phone_e164: string | null;
};

export const DEFAULT_CLASS_REMINDER_CHANNEL_PREFS: ClassReminderChannelPrefsRow = {
  email_class_prep: true,
  in_app_class_urgent: true,
  whatsapp_class_urgent: false,
  whatsapp_opt_in_at: null,
  whatsapp_phone_e164: null,
};

export function mergeClassReminderChannelPrefs(
  row: Partial<ClassReminderChannelPrefsRow> | null | undefined,
): ClassReminderChannelPrefsRow {
  if (!row) return { ...DEFAULT_CLASS_REMINDER_CHANNEL_PREFS };
  return {
    email_class_prep: row.email_class_prep ?? DEFAULT_CLASS_REMINDER_CHANNEL_PREFS.email_class_prep,
    in_app_class_urgent: row.in_app_class_urgent ?? DEFAULT_CLASS_REMINDER_CHANNEL_PREFS.in_app_class_urgent,
    whatsapp_class_urgent:
      row.whatsapp_class_urgent ?? DEFAULT_CLASS_REMINDER_CHANNEL_PREFS.whatsapp_class_urgent,
    whatsapp_opt_in_at: row.whatsapp_opt_in_at ?? null,
    whatsapp_phone_e164: row.whatsapp_phone_e164 ?? null,
  };
}
