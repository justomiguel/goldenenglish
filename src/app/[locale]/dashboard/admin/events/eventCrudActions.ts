"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugifyEventTitle } from "@/lib/events/slugifyEventTitle";
import type { EventLocale } from "@/lib/events/domain";
import { sanitizeEventBankTransferInstructions } from "@/lib/events/sanitizeEventBankTransferInstructions";
import {
  sanitizeEventBankTransferSourcesConfig,
  type EventBankTransferSourcesConfig,
} from "@/lib/events/eventBankTransferSources";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  adminEventsPath,
  requireAdminEventActor,
  sanitizeEventDescriptionInput,
  type EventMutationResult,
} from "@/app/[locale]/dashboard/admin/events/eventActionsShared";

export async function createEventAction(input: {
  locale: string;
  title: string;
  description?: string;
  eventDate: string;
  location?: string;
  capacity: number;
  priceLocal?: number | null;
  priceNonLocal?: number | null;
  price?: number | null;
  currency?: string;
  bankTransferInstructions?: string | null;
  bankTransferSourcesConfig?: EventBankTransferSourcesConfig | null;
  allowFamilyDiscount?: boolean;
  allowMinorTickets?: boolean;
  minorTicketPrice?: number | null;
  defaultLocale?: EventLocale;
  sectionId?: string | null;
  privateToSection?: boolean;
}): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };
  const admin = await createAdminClient();
  const slug = slugifyEventTitle(input.title);
  const defaultLocale = input.defaultLocale ?? "es";
  const priceLocal = input.priceLocal ?? input.price ?? null;
  const priceNonLocal = input.priceNonLocal ?? priceLocal;
  const description = sanitizeEventDescriptionInput(input.description);
  const bankTransferSourcesConfig =
    input.bankTransferSourcesConfig === undefined
      ? undefined
      : sanitizeEventBankTransferSourcesConfig(input.bankTransferSourcesConfig);
  const { data, error } = await admin
    .from("events")
    .insert({
      slug,
      title: input.title.trim(),
      description,
      event_date: input.eventDate,
      location: input.location?.trim() || null,
      section_id: input.sectionId ?? null,
      private_to_section: Boolean(input.privateToSection),
      capacity: input.capacity,
      price: priceLocal,
      price_local: priceLocal,
      price_non_local: priceNonLocal,
      currency: input.currency ?? "CLP",
      bank_transfer_instructions: sanitizeEventBankTransferInstructions(
        input.bankTransferInstructions,
      ),
      ...(bankTransferSourcesConfig !== undefined ? { bank_transfer_sources_config: bankTransferSourcesConfig } : {}),
      ...(input.allowFamilyDiscount !== undefined ? { allow_family_discount: Boolean(input.allowFamilyDiscount) } : {}),
      default_locale: defaultLocale,
      created_by: actorId,
      status: "draft",
    })
    .select("id")
    .single();
  if (error) {
    logSupabaseClientError("createEventAction:insert", error, {});
    return { ok: false, message: "save_failed" };
  }

  const eventId = String(data.id);
  const { error: translationError } = await admin.from("event_translations").insert({
    event_id: eventId,
    locale: defaultLocale,
    title: input.title.trim(),
    description,
    location: input.location?.trim() || null,
  });
  if (translationError) {
    logSupabaseClientError("createEventAction:translation", translationError, { eventId });
    return { ok: false, message: "save_failed" };
  }

  if (bankTransferSourcesConfig !== undefined) {
    await recordSystemAudit({
      action: "event_bank_transfer_sources_updated",
      resourceType: "event",
      resourceId: eventId,
      payload: {
        enabled: Boolean(bankTransferSourcesConfig?.enabled),
        mode: bankTransferSourcesConfig?.mode ?? null,
      },
    });
  }

  revalidatePath(adminEventsPath(input.locale), "page");
  revalidatePath(`${adminEventsPath(input.locale)}/new`, "page");
  return { ok: true, eventId };
}

export async function updateEventAction(input: {
  locale: string;
  eventId: string;
  title: string;
  description?: string;
  eventDate: string;
  location?: string;
  capacity: number;
  priceLocal?: number | null;
  priceNonLocal?: number | null;
  price?: number | null;
  currency?: string;
  bankTransferInstructions?: string | null;
  bankTransferSourcesConfig?: EventBankTransferSourcesConfig | null;
  allowFamilyDiscount?: boolean;
  allowMinorTickets?: boolean;
  minorTicketPrice?: number | null;
  allowMultipleTickets?: boolean;
  maxTicketsPerRegistration?: number | null;
  companionRequireDetails?: boolean;
  companionCollectDni?: boolean;
  companionCollectEmail?: boolean;
  companionCollectBirthDate?: boolean;
  sectionId?: string | null;
  privateToSection?: boolean;
}): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };
  const admin = await createAdminClient();
  const priceLocal = input.priceLocal ?? input.price ?? null;
  const priceNonLocal = input.priceNonLocal ?? priceLocal;
  const description = sanitizeEventDescriptionInput(input.description);
  const bankTransferInstructions = sanitizeEventBankTransferInstructions(
    input.bankTransferInstructions,
  );
  const bankTransferSourcesConfig =
    input.bankTransferSourcesConfig === undefined
      ? undefined
      : sanitizeEventBankTransferSourcesConfig(input.bankTransferSourcesConfig);
  const { error } = await admin
    .from("events")
    .update({
      title: input.title.trim(),
      description,
      event_date: input.eventDate,
      location: input.location?.trim() || null,
      section_id: input.sectionId ?? null,
      private_to_section: Boolean(input.privateToSection),
      capacity: input.capacity,
      price: priceLocal,
      price_local: priceLocal,
      price_non_local: priceNonLocal,
      currency: input.currency ?? "CLP",
      bank_transfer_instructions: bankTransferInstructions,
      ...(bankTransferSourcesConfig !== undefined ? { bank_transfer_sources_config: bankTransferSourcesConfig } : {}),
      ...(input.allowFamilyDiscount !== undefined ? { allow_family_discount: Boolean(input.allowFamilyDiscount) } : {}),
      ...(input.allowMinorTickets !== undefined
        ? {
            allow_minor_tickets: Boolean(input.allowMinorTickets),
            minor_ticket_price: input.allowMinorTickets ? input.minorTicketPrice ?? null : null,
          }
        : {}),
      ...(input.allowMultipleTickets !== undefined
        ? {
            allow_multiple_tickets: Boolean(input.allowMultipleTickets),
            max_tickets_per_registration: null,
          }
        : {}),
      ...(input.companionRequireDetails !== undefined ? { companion_require_details: Boolean(input.companionRequireDetails) } : {}),
      ...(input.companionCollectDni !== undefined ? { companion_collect_dni: Boolean(input.companionCollectDni) } : {}),
      ...(input.companionCollectEmail !== undefined ? { companion_collect_email: Boolean(input.companionCollectEmail) } : {}),
      ...(input.companionCollectBirthDate !== undefined ? { companion_collect_birth_date: Boolean(input.companionCollectBirthDate) } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.eventId);
  if (error) {
    logSupabaseClientError("updateEventAction:update", error, { eventId: input.eventId });
    return { ok: false, message: "save_failed" };
  }

  if (bankTransferSourcesConfig !== undefined) {
    await recordSystemAudit({
      action: "event_bank_transfer_sources_updated",
      resourceType: "event",
      resourceId: input.eventId,
      payload: {
        enabled: Boolean(bankTransferSourcesConfig?.enabled),
        mode: bankTransferSourcesConfig?.mode ?? null,
      },
    });
  }

  const { data: slugRow } = await admin.from("events").select("slug").eq("id", input.eventId).maybeSingle();
  revalidatePath(adminEventsPath(input.locale), "page");
  revalidatePath(`${adminEventsPath(input.locale)}/${input.eventId}`, "page");
  if (slugRow?.slug) {
    revalidatePath(`/${input.locale}/events/${String(slugRow.slug)}`, "page");
    revalidatePath(`/${input.locale}/events/${String(slugRow.slug)}/register`, "page");
  }
  return { ok: true };
}
