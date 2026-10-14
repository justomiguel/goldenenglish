import "server-only";

import type { EventEmailTemplateKey } from "@/lib/events/eventEmailCopy";
import { parseEventEmailLocale } from "@/lib/events/eventEmailCopy";
import { notifyAttendeeViaResend } from "@/lib/events/server/notifyAttendeeViaResend";
import { registrationFlowName } from "@/lib/events/server/loadActiveRegistrationFlows";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { createAdminClient } from "@/lib/supabase/admin";

/** Loads the attendee and sends one event mail. Failures are logged and do not throw. */
export async function sendEventAttendeeNotification(input: {
  attendeeId: string;
  templateKey: EventEmailTemplateKey;
}): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data: attendee, error } = await admin
      .from("event_attendees")
      .select("email, first_name, last_name, registration_locale, registration_flow_id, event_id")
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

    return notifyAttendeeViaResend({
      to: String(attendee.email),
      templateKey: input.templateKey,
      locale,
      eventId: String(attendee.event_id),
      flowId,
      vars: {
        firstName: String(attendee.first_name ?? ""),
        lastName: String(attendee.last_name ?? ""),
        eventName: String(event?.title ?? ""),
        flowName,
        eventDate,
        eventLocation: String(event?.location ?? ""),
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
