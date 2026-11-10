import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventEmailTemplateKey } from "@/lib/events/eventEmailCopy";
import { parseEventEmailLocale } from "@/lib/events/eventEmailCopy";
import { brandFrameForSlug, eventEntryMailSlug } from "@/lib/events/server/eventMailBrand";
import { notifyAttendeeViaResend } from "@/lib/events/server/notifyAttendeeViaResend";
import { registrationFlowName } from "@/lib/events/server/loadActiveRegistrationFlows";
import { ownerAdminClient } from "@/lib/events/server/resolveEventDataClient";
import { logServerError, logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { createAdminClient } from "@/lib/supabase/admin";

/** Loads the attendee and sends one event mail. Failures are logged and do not throw. */
export async function sendEventAttendeeNotification(input: {
  attendeeId: string;
  templateKey: EventEmailTemplateKey;
  /** Included only for mails that show why the registration changed. */
  reason?: string;
  dataClient?: SupabaseClient;
}): Promise<boolean> {
  try {
    const admin = input.dataClient ?? (await createAdminClient());
    const { data: attendee, error } = await admin
      .from("event_attendees")
      .select(
        "email, first_name, last_name, registration_locale, registration_flow_id, event_id, entry_host_slug",
      )
      .eq("id", input.attendeeId)
      .maybeSingle();
    if (error) {
      logSupabaseClientError("sendEventAttendeeNotification:attendee", error, {
        attendeeId: input.attendeeId,
        templateKey: input.templateKey,
      });
      return false;
    }
    if (!attendee?.email || !attendee.event_id) return false;

    const locale = parseEventEmailLocale(
      attendee.registration_locale ? String(attendee.registration_locale) : null,
    );
    const { data: event } = await admin
      .from("events")
      .select("title, event_date, location")
      .eq("id", attendee.event_id)
      .maybeSingle();

    let flowName = "";
    const flowId = attendee.registration_flow_id ? String(attendee.registration_flow_id) : null;
    if (flowId) {
      const { data: flow } = await admin
        .from("event_registration_flows")
        .select("name_i18n")
        .eq("id", flowId)
        .maybeSingle();
      const names = (flow?.name_i18n as Record<string, string> | null) ?? {};
      flowName = registrationFlowName(names, locale, "es");
    }

    const eventDate = event?.event_date
      ? new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short" }).format(
          new Date(String(event.event_date)),
        )
      : "";

    const entrySlug = eventEntryMailSlug(attendee.entry_host_slug);
    const frame = entrySlug ? await brandFrameForSlug(entrySlug) : null;
    const templateClient = entrySlug ? ownerAdminClient(entrySlug) : null;
    if (entrySlug && !frame) {
      logServerError("events.shared.write", { code: "share_store_failed", op: "mail_brand" });
    }

    return notifyAttendeeViaResend({
      to: String(attendee.email),
      templateKey: input.templateKey,
      locale,
      eventId: String(attendee.event_id),
      flowId,
      dataClient: admin,
      ...(templateClient ? { templateClient } : {}),
      ...(frame ? { brand: frame.brand, origin: frame.origin } : {}),
      vars: {
        firstName: String(attendee.first_name ?? ""),
        lastName: String(attendee.last_name ?? ""),
        eventName: String(event?.title ?? ""),
        flowName,
        eventDate,
        eventLocation: String(event?.location ?? ""),
        reason: input.reason ?? "",
      },
    });
  } catch (error) {
    logServerException("sendEventAttendeeNotification", error, {
      attendeeId: input.attendeeId,
      templateKey: input.templateKey,
    });
    return false;
  }
}
