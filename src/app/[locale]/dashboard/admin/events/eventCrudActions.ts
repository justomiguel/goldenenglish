"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugifyEventTitle } from "@/lib/events/slugifyEventTitle";
import type { EventLocale } from "@/lib/events/domain";
import { sanitizeEventBankTransferInstructions } from "@/lib/events/sanitizeEventBankTransferInstructions";
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
  defaultLocale?: EventLocale;
  sectionId?: string | null;
  privateToSection?: boolean;
}): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };
  const admin = createAdminClient();
  const slug = slugifyEventTitle(input.title);
  const defaultLocale = input.defaultLocale ?? "es";
  const priceLocal = input.priceLocal ?? input.price ?? null;
  const priceNonLocal = input.priceNonLocal ?? priceLocal;
  const description = sanitizeEventDescriptionInput(input.description);
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
  sectionId?: string | null;
  privateToSection?: boolean;
}): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };
  const admin = createAdminClient();
  const priceLocal = input.priceLocal ?? input.price ?? null;
  const priceNonLocal = input.priceNonLocal ?? priceLocal;
  const description = sanitizeEventDescriptionInput(input.description);
  const bankTransferInstructions = sanitizeEventBankTransferInstructions(
    input.bankTransferInstructions,
  );
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
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.eventId);
  if (error) {
    logSupabaseClientError("updateEventAction:update", error, { eventId: input.eventId });
    return { ok: false, message: "save_failed" };
  }

  const { data: slugRow } = await admin
    .from("events")
    .select("slug")
    .eq("id", input.eventId)
    .maybeSingle();
  revalidatePath(adminEventsPath(input.locale), "page");
  revalidatePath(`${adminEventsPath(input.locale)}/${input.eventId}`, "page");
  if (slugRow?.slug) {
    revalidatePath(`/${input.locale}/events/${String(slugRow.slug)}`, "page");
    revalidatePath(`/${input.locale}/events/${String(slugRow.slug)}/register`, "page");
  }
  return { ok: true };
}

export async function publishEventAction(locale: string, eventId: string): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };
  const admin = createAdminClient();
  const { error } = await admin
    .from("events")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", eventId);
  if (error) return { ok: false, message: error.message };
  revalidatePath(adminEventsPath(locale), "page");
  revalidatePath(`/${locale}/events`, "page");
  return { ok: true };
}

export async function unpublishEventAction(locale: string, eventId: string): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };
  const admin = createAdminClient();
  const { error } = await admin.from("events").update({ status: "draft" }).eq("id", eventId);
  if (error) {
    logSupabaseClientError("unpublishEventAction:update", error, { eventId });
    return { ok: false, message: "save_failed" };
  }
  revalidatePath(adminEventsPath(locale), "page");
  revalidatePath(`${adminEventsPath(locale)}/${eventId}`, "page");
  revalidatePath(`/${locale}/events`, "page");
  return { ok: true };
}

export async function archiveEventAction(locale: string, eventId: string): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };
  const admin = createAdminClient();
  const { error } = await admin
    .from("events")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", eventId);
  if (error) return { ok: false, message: error.message };
  revalidatePath(adminEventsPath(locale), "page");
  revalidatePath(`/${locale}/events`, "page");
  return { ok: true };
}
