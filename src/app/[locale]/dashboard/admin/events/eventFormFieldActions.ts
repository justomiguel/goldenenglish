"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  adminEventsPath,
  requireAdminEventActor,
  type EventMutationResult,
} from "@/app/[locale]/dashboard/admin/events/eventActionsShared";

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
  revalidatePath(adminEventsPath(input.locale), "page");
  revalidatePath(`${adminEventsPath(input.locale)}/${input.eventId}`, "page");
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
  revalidatePath(adminEventsPath(locale), "page");
  revalidatePath(`${adminEventsPath(locale)}/${eventId}`, "page");
  return { ok: true };
}
