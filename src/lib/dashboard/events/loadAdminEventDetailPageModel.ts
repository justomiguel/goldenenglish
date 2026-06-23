import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadEventAttendeesPaginated, loadEventAttendeesCount } from "@/lib/dashboard/events/loadEventAttendeesPaginated";
import { loadEventAttendeeCustomFieldValues } from "@/lib/dashboard/events/loadEventAttendeeCustomFieldValues";
import { loadEventPaymentsPaginated } from "@/lib/dashboard/events/loadEventPaymentsPaginated";
import { loadEventTranslations } from "@/lib/events/server/loadEventTranslations";
import { isEventLocale, type EventLocale } from "@/lib/events/domain";
import {
  eventHasTieredPricing,
  resolveEventLocalPrice,
  resolveEventNonLocalPrice,
} from "@/lib/events/resolveEventPriceTier";
import type { EventFormFieldType } from "@/lib/events/types";

import { EVENT_ATTENDEES_LIST_PAGE_SIZE } from "@/lib/dashboard/events/eventAttendeesListConstants";

export async function loadAdminEventDetailPageModel(input: {
  locale: string;
  eventId: string;
  tab?: string;
  attendeesPage?: string;
  attendeesQ?: string;
  paymentsPage?: string;
  paymentsQ?: string;
  /** @deprecated use attendeesPage / paymentsPage */
  page?: string;
  /** @deprecated use attendeesQ / paymentsQ */
  q?: string;
  paymentStatus?: string;
}) {
  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select(
      "id, title, description, event_date, status, capacity, location, price, price_local, price_non_local, currency, default_locale, view_count, bank_transfer_instructions, collect_birth_date",
    )
    .eq("id", input.eventId)
    .maybeSingle();
  if (!event) notFound();

  const defaultLocale: EventLocale = isEventLocale(String(event.default_locale ?? "es"))
    ? (String(event.default_locale) as EventLocale)
    : "es";

  const translations = await loadEventTranslations(admin, input.eventId);
  const attendeesPage = Math.max(
    1,
    Number.parseInt(input.attendeesPage ?? input.page ?? "1", 10) || 1,
  );
  const attendeesQuery = (input.attendeesQ ?? input.q ?? "").trim();
  const loadAttendeeRows = input.tab === "attendees";
  const attendees = loadAttendeeRows
    ? await loadEventAttendeesPaginated(admin, {
        eventId: input.eventId,
        page: attendeesPage,
        pageSize: EVENT_ATTENDEES_LIST_PAGE_SIZE,
        q: attendeesQuery || undefined,
      })
    : {
        rows: [],
        totalCount: await loadEventAttendeesCount(admin, { eventId: input.eventId }),
        page: 1,
        pageSize: EVENT_ATTENDEES_LIST_PAGE_SIZE,
      };
  const attendeeCustomFields = loadAttendeeRows
    ? await loadEventAttendeeCustomFieldValues(
        admin,
        attendees.rows.map((row) => row.id),
        input.locale,
      )
    : {};
  const paymentStatusFilter = ["all", "pending", "approved", "rejected"].includes(input.paymentStatus ?? "")
    ? (input.paymentStatus as string)
    : "all";
  const paymentsPage = Math.max(
    1,
    Number.parseInt(input.paymentsPage ?? input.page ?? "1", 10) || 1,
  );
  const paymentsQuery = (input.paymentsQ ?? input.q ?? "").trim();
  const eventPayments = await loadEventPaymentsPaginated(admin, {
    eventId: input.eventId,
    page: paymentsPage,
    pageSize: 25,
    q: paymentsQuery || undefined,
    status: paymentStatusFilter,
  });
  const { data: fields } = await admin
    .from("event_form_fields")
    .select("id, field_key, field_type, label_i18n, options_i18n, required, position")
    .eq("event_id", input.eventId)
    .is("archived_at", null)
    .order("position", { ascending: true });

  const priceSource = {
    price: event.price == null ? null : Number(event.price),
    priceLocal: event.price_local == null ? null : Number(event.price_local),
    priceNonLocal: event.price_non_local == null ? null : Number(event.price_non_local),
  };
  const collectBirthDate = Boolean(event.collect_birth_date);
  const showResidencyField = eventHasTieredPricing(priceSource);
  const localPrice = resolveEventLocalPrice(priceSource) ?? 0;
  const nonLocalPrice = resolveEventNonLocalPrice(priceSource) ?? 0;
  const showPaymentField = localPrice > 0 || nonLocalPrice > 0;
  const showBirthDateField = collectBirthDate;
  const mappedFields = (fields ?? []).map((field) => ({
    id: String(field.id),
    fieldKey: String(field.field_key),
    fieldType: String(field.field_type) as EventFormFieldType,
    labelI18n: (field.label_i18n as Record<string, string>) ?? {},
    optionsI18n: (field.options_i18n as Record<string, string[]>) ?? {},
    required: Boolean(field.required),
    position: Number(field.position),
  }));
  const nextFieldPosition =
    mappedFields.reduce((max, field) => Math.max(max, field.position), -1) + 1;

  return {
    event,
    defaultLocale,
    translations,
    attendees,
    attendeeCustomFields,
    attendeesQuery,
    paymentStatusFilter,
    eventPayments,
    paymentsQuery,
    mappedFields,
    collectBirthDate,
    showBirthDateField,
    showResidencyField,
    showPaymentField,
    nextFieldPosition,
  };
}
