export const EMAIL_SENDS_ENABLED_KEY = "email_sends_enabled";
export const CLASS_REMINDERS_ENABLED_KEY = "class_reminders_enabled";
export const CLASS_REMINDER_TEMPLATE_KEY = "notifications.class_reminder_prep";

export function parseEmailSendsEnabled(value: unknown): Record<string, boolean> {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, boolean> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry === "boolean") out[key] = entry;
  }
  return out;
}

export function isEmailSendEnabled(
  map: Record<string, boolean>,
  templateKey: string,
): boolean {
  return map[templateKey] !== false;
}

export function isProductEmailEnabled(input: {
  map: Record<string, boolean>;
  classRemindersEnabled: boolean;
  templateKey: string;
}): boolean {
  if (input.templateKey === CLASS_REMINDER_TEMPLATE_KEY) {
    return input.classRemindersEnabled === true && input.map[input.templateKey] !== false;
  }
  return input.map[input.templateKey] !== false;
}
