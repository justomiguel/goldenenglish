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

import { loadActiveRegistrationFlows } from "@/lib/events/server/loadActiveRegistrationFlows";
import { EVENT_ATTENDEES_LIST_PAGE_SIZE } from "@/lib/dashboard/events/eventAttendeesListConstants";
import {
  loadEventDiscountCodeCount,
  loadEventDiscountCodes,
} from "@/lib/dashboard/events/loadEventDiscountCodes";
import { loadEventDiscountCodeUses } from "@/lib/dashboard/events/loadEventDiscountCodeUses";

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
  const admin = await createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select(
      "id, slug, title, description, event_date, status, capacity, location, price, price_local, price_non_local, currency, default_locale, view_count, bank_transfer_instructions, collect_birth_date, show_on_home, require_phone, require_birth_date, registration_field_order, price_by_flow",
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
    .select("id, field_key, field_type, label_i18n, options_i18n, required, position, allowed_mime_types, flow_id")
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
    allowedMimeTypes: Array.isArray(field.allowed_mime_types)
      ? (field.allowed_mime_types as string[])
      : [],
    flowId: field.flow_id == null ? null : String(field.flow_id),
  }));
  const nextFieldPosition =
    mappedFields.reduce((max, field) => Math.max(max, field.position), -1) + 1;

  const registrationFlows = await loadActiveRegistrationFlows(admin, input.eventId);
  const discountCodeCount = await loadEventDiscountCodeCount(admin, input.eventId);
  const loadedCodes = input.tab === "codes" ? await loadEventDiscountCodes(admin, input.eventId) : [];
  const loadedUses =
    input.tab === "codes"
      ? await loadEventDiscountCodeUses(admin, loadedCodes.map((row) => row.id))
      : { uses: [], truncated: false };
  const usesByCode = new Map<string, typeof loadedUses.uses>();
  for (const use of loadedUses.uses) {
    const list = usesByCode.get(use.codeId) ?? [];
    list.push(use);
    usesByCode.set(use.codeId, list);
  }
  const discountCodes = loadedCodes.map((row) => ({ ...row, uses: usesByCode.get(row.id) ?? [] }));

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
    registrationFieldOrder: Array.isArray(event.registration_field_order)
      ? event.registration_field_order.map((token) => String(token))
      : [],
    requirePhone: Boolean(event.require_phone),
    requireBirthDate: Boolean(event.require_birth_date),
    priceByFlow: Boolean(event.price_by_flow),
    registrationFlows,
    discountCodeCount,
    discountCodes,
    discountCodeUsesTruncated: loadedUses.truncated,
  };
}
