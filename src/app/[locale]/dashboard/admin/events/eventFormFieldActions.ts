"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  adminEventsPath,
  requireAdminEventActor,
  type EventMutationResult,
} from "@/app/[locale]/dashboard/admin/events/eventActionsShared";

async function revalidateEventFormSurfaces(locale: string, eventId: string): Promise<void> {
  revalidatePath(adminEventsPath(locale), "page");
  revalidatePath(`${adminEventsPath(locale)}/${eventId}`, "page");
  const admin = createAdminClient();
  const { data: slugRow } = await admin.from("events").select("slug").eq("id", eventId).maybeSingle();
  if (slugRow?.slug) {
    const slug = String(slugRow.slug);
    revalidatePath(`/${locale}/events/${slug}`, "page");
    revalidatePath(`/${locale}/events/${slug}/register`, "page");
  }
}

export async function addEventFormFieldAction(input: {
  locale: string;
  eventId: string;
  fieldKey: string;
  fieldType: string;
  labelI18n: Record<string, string>;
  required: boolean;
  position: number;
  optionsI18n?: Record<string, string[]>;
  allowedMimeTypes?: string[];
}): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };

  const { normalizeEventFormFieldKey } = await import("@/lib/events/normalizeEventFormFieldKey");
  const normalizedKey = normalizeEventFormFieldKey(input.fieldKey);
  if (!normalizedKey.ok) return { ok: false, message: "invalid_field_key" };

  const trimmedLabels = Object.fromEntries(
    Object.entries(input.labelI18n)
      .map(([key, value]) => [key, value.trim()] as const)
      .filter(([, value]) => value.length > 0),
  );
  if (Object.keys(trimmedLabels).length === 0) {
    return { ok: false, message: "invalid_label" };
  }

  if (input.fieldType === "select") {
    const { sanitizeEventFormFieldSelectOptions } = await import(
      "@/lib/events/sanitizeEventFormFieldSelectOptions"
    );
    const localeOptions = input.optionsI18n?.[input.locale] ?? [];
    const sanitized = sanitizeEventFormFieldSelectOptions(localeOptions);
    if (!sanitized.ok) {
      return { ok: false, message: "invalid_select_options" };
    }
  }

  const trimmedOptionsI18n = input.optionsI18n
    ? Object.fromEntries(
        Object.entries(input.optionsI18n)
          .map(([key, values]) => [key, values.map((value) => value.trim()).filter(Boolean)] as const)
          .filter(([, values]) => values.length > 0),
      )
    : {};

  const admin = createAdminClient();
  const { error } = await admin.from("event_form_fields").insert({
    event_id: input.eventId,
    field_key: normalizedKey.value,
    field_type: input.fieldType,
    label_i18n: trimmedLabels,
    options_i18n: trimmedOptionsI18n,
    required: input.required,
    position: input.position,
    allowed_mime_types: input.allowedMimeTypes ?? [],
  });
  if (error) {
    if (error.code === "23505") return { ok: false, message: "duplicate_key" };
    logSupabaseClientError("addEventFormFieldAction:insert", error, { eventId: input.eventId });
    return { ok: false, message: "save_failed" };
  }
  await revalidateEventFormSurfaces(input.locale, input.eventId);
  return { ok: true };
}

const updateEventFormFieldSchema = z.object({
  locale: z.string().min(2),
  fieldId: z.string().uuid(),
  label: z.string().trim().min(1).max(200),
  required: z.boolean(),
  selectOptions: z.array(z.string()).optional(),
  allowedMimeTypes: z.array(z.string()).optional(),
});

export async function updateEventFormFieldAction(raw: unknown): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };

  const parsed = updateEventFormFieldSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "validation_failed" };

  const { locale, fieldId, label, required, selectOptions, allowedMimeTypes } = parsed.data;
  const admin = createAdminClient();
  const { data: field, error: lookupError } = await admin
    .from("event_form_fields")
    .select(
      "id, event_id, field_key, field_type, label_i18n, options_i18n, required, allowed_mime_types, archived_at",
    )
    .eq("id", fieldId)
    .maybeSingle();

  if (lookupError) {
    logSupabaseClientError("updateEventFormFieldAction:lookup", lookupError, { fieldId });
    return { ok: false, message: "field_not_found" };
  }
  if (!field?.event_id) return { ok: false, message: "field_not_found" };
  if (field.archived_at) return { ok: false, message: "field_archived" };

  const fieldType = String(field.field_type);
  const existingLabels =
    field.label_i18n && typeof field.label_i18n === "object" && !Array.isArray(field.label_i18n)
      ? (field.label_i18n as Record<string, string>)
      : {};
  const existingOptions =
    field.options_i18n && typeof field.options_i18n === "object" && !Array.isArray(field.options_i18n)
      ? (field.options_i18n as Record<string, string[]>)
      : {};

  const nextLabelI18n = { ...existingLabels, [locale]: label };
  let nextOptionsI18n = existingOptions;
  let nextMimeTypes = Array.isArray(field.allowed_mime_types)
    ? (field.allowed_mime_types as string[])
    : [];

  if (fieldType === "select") {
    const { sanitizeEventFormFieldSelectOptions } = await import(
      "@/lib/events/sanitizeEventFormFieldSelectOptions"
    );
    const sanitized = sanitizeEventFormFieldSelectOptions(selectOptions ?? []);
    if (!sanitized.ok) return { ok: false, message: "invalid_select_options" };
    nextOptionsI18n = { ...existingOptions, [locale]: sanitized.values };
  }

  if (fieldType === "file" || fieldType === "image") {
    nextMimeTypes = (allowedMimeTypes ?? []).map((value) => value.trim().toLowerCase()).filter(Boolean);
  }

  const eventId = String(field.event_id);
  const { error } = await admin
    .from("event_form_fields")
    .update({
      label_i18n: nextLabelI18n,
      options_i18n: nextOptionsI18n,
      required,
      allowed_mime_types: nextMimeTypes,
    })
    .eq("id", fieldId);

  if (error) {
    logSupabaseClientError("updateEventFormFieldAction:update", error, { fieldId, eventId });
    return { ok: false, message: "save_failed" };
  }

  void recordSystemAudit({
    action: "event_form_field_updated",
    resourceType: "event_form_field",
    resourceId: fieldId,
    payload: {
      event_id: eventId,
      field_key: String(field.field_key),
      field_type: fieldType,
      locale,
      required,
    },
  });

  await revalidateEventFormSurfaces(locale, eventId);
  return { ok: true };
}

export async function archiveEventFormFieldAction(locale: string, fieldId: string): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };
  const admin = createAdminClient();
  const { data: field, error: lookupError } = await admin
    .from("event_form_fields")
    .select("event_id")
    .eq("id", fieldId)
    .maybeSingle();
  if (lookupError || !field?.event_id) {
    if (lookupError) logSupabaseClientError("archiveEventFormFieldAction:lookup", lookupError, { fieldId });
    return { ok: false, message: "field_not_found" };
  }
  const { error } = await admin
    .from("event_form_fields")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", fieldId);
  if (error) {
    logSupabaseClientError("archiveEventFormFieldAction:update", error, { fieldId });
    return { ok: false, message: error.message };
  }
  const eventId = String(field.event_id);
  await revalidateEventFormSurfaces(locale, eventId);
  return { ok: true };
}
