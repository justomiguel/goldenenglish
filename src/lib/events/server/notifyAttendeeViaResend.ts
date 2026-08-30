import "server-only";
import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";
import { logServerException } from "@/lib/logging/serverActionLog";
import type { EventsEmailKey } from "@/lib/email/templates/registryEvents";
import type { Locale } from "@/types/i18n";

export type EventNotificationTemplateKey = EventsEmailKey;

export async function notifyAttendeeViaResend(input: {
  to: string;
  templateKey: EventNotificationTemplateKey;
  locale: Locale;
}): Promise<boolean> {
  try {
    const result = await sendBrandedEmail({
      to: input.to,
      templateKey: input.templateKey,
      locale: input.locale,
    });
    return result.ok;
  } catch (error) {
    logServerException("notifyAttendeeViaResend", error);
    return false;
  }
}
