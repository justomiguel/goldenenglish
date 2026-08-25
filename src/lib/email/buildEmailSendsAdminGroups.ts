import type { EmailTemplateDefinition } from "@/types/emailTemplates";
import type { Locale } from "@/types/i18n";
import {
  CLASS_REMINDER_TEMPLATE_KEY,
  isProductEmailEnabled,
} from "@/lib/email/emailSendsEnabled";

export type EmailSendUiGroupId =
  | "automated"
  | "billing"
  | "academics"
  | "messaging"
  | "other";

export const EMAIL_SEND_UI_GROUP_ORDER: readonly EmailSendUiGroupId[] = [
  "automated",
  "billing",
  "academics",
  "messaging",
  "other",
];

export type EmailSendsAdminRow = {
  templateKey: string;
  enabled: boolean;
  label: string;
};

export type EmailSendsAdminGroup = {
  id: EmailSendUiGroupId;
  rows: EmailSendsAdminRow[];
};

export function emailSendUiGroupFor(def: EmailTemplateDefinition): EmailSendUiGroupId {
  if (def.key === "churn.inactivity" || def.key === CLASS_REMINDER_TEMPLATE_KEY) {
    return "automated";
  }
  if (def.category === "billing") return "billing";
  if (def.category === "academics") return "academics";
  if (def.category === "messaging") return "messaging";
  return "other";
}

export function buildEmailSendsAdminGroups(
  defs: ReadonlyArray<EmailTemplateDefinition>,
  map: Record<string, boolean>,
  classRemindersEnabled: boolean,
  locale: Locale,
  overrides: { inactivity: string; classReminder: string },
): EmailSendsAdminGroup[] {
  const buckets = new Map<EmailSendUiGroupId, EmailSendsAdminRow[]>();
  for (const id of EMAIL_SEND_UI_GROUP_ORDER) buckets.set(id, []);
  for (const def of defs) {
    const id = emailSendUiGroupFor(def);
    buckets.get(id)?.push({
      templateKey: def.key,
      enabled: isProductEmailEnabled({
        map,
        classRemindersEnabled,
        templateKey: def.key,
      }),
      label: emailSendRowLabel(def, locale, overrides),
    });
  }
  return EMAIL_SEND_UI_GROUP_ORDER.flatMap((id) => {
    const rows = buckets.get(id) ?? [];
    return rows.length > 0 ? [{ id, rows }] : [];
  });
}

export function emailSendRowLabel(
  def: EmailTemplateDefinition,
  locale: Locale,
  overrides: { inactivity: string; classReminder: string },
): string {
  if (def.key === "churn.inactivity") return overrides.inactivity;
  if (def.key === CLASS_REMINDER_TEMPLATE_KEY) return overrides.classReminder;
  return locale === "en" ? def.label.en : def.label.es;
}
