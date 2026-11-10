import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BrandPublic } from "@/lib/brand/server";
import { sendBrandedEmail } from "@/lib/email/templates/sendBrandedEmail";
import { loadResolvedEventEmail } from "@/lib/events/server/loadResolvedEventEmail";
import { logServerException } from "@/lib/logging/serverActionLog";
import type { EventsEmailKey } from "@/lib/email/templates/registryEvents";
import type { Locale } from "@/types/i18n";

export type EventNotificationTemplateKey = EventsEmailKey;

export async function notifyAttendeeViaResend(input: {
  to: string;
  templateKey: EventNotificationTemplateKey;
  locale: Locale;
  eventId?: string;
  flowId?: string | null;
  vars?: Record<string, string>;
  dataClient?: SupabaseClient;
  templateClient?: SupabaseClient;
  brand?: BrandPublic;
  origin?: string;
}): Promise<boolean> {
  try {
    const content = input.eventId
      ? await loadResolvedEventEmail({
          eventId: input.eventId,
          templateKey: input.templateKey,
          locale: input.locale,
          flowId: input.flowId,
          vars: input.vars,
          dataClient: input.dataClient,
          templateClient: input.templateClient,
        })
      : null;
    if (input.eventId && !content) return false;
    const result = await sendBrandedEmail({
      to: input.to,
      templateKey: input.templateKey,
      locale: input.locale,
      ...(content ? { content } : input.vars ? { vars: input.vars } : {}),
      ...(input.brand ? { brand: input.brand } : {}),
      ...(input.origin ? { origin: input.origin } : {}),
    });
    return result.ok;
  } catch (error) {
    logServerException("notifyAttendeeViaResend", error);
    return false;
  }
}
