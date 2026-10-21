import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { slugifyEventTitle } from "@/lib/events/slugifyEventTitle";
import {
  buildDuplicateEventInsert,
  duplicateEventTitle,
  pickDuplicateEventSlug,
  remapDuplicateFlowId,
  type DuplicateEventSource,
} from "@/lib/events/duplicateEventPlan";

const EVENT_COLUMNS = [
  "title",
  "description",
  "event_date",
  "location",
  "section_id",
  "private_to_section",
  "capacity",
  "price",
  "price_local",
  "price_non_local",
  "currency",
  "default_locale",
  "cover_image_path",
  "bank_transfer_instructions",
  "collect_birth_date",
  "require_phone",
  "require_birth_date",
  "registration_field_order",
  "price_by_flow",
  "allow_multiple_tickets",
  "max_tickets_per_registration",
  "companion_collect_dni",
  "companion_collect_birth_date",
  "companion_collect_email",
].join(", ");

export type DuplicateEventServerResult =
  | { ok: true; eventId: string }
  | { ok: false; code: "not_found" | "save_failed" };

async function rollback(admin: SupabaseClient, eventId: string): Promise<void> {
  const { error } = await admin.from("events").delete().eq("id", eventId);
  if (error) logSupabaseClientError("duplicateEventServer:rollback", error, { eventId });
}

export async function duplicateEventServer(
  admin: SupabaseClient,
  input: { eventId: string; actorId: string },
): Promise<DuplicateEventServerResult> {
  const { data: source, error: sourceError } = await admin
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("id", input.eventId)
    .maybeSingle();
  if (sourceError) {
    logSupabaseClientError("duplicateEventServer:source", sourceError, { eventId: input.eventId });
    return { ok: false, code: "save_failed" };
  }
  if (!source) return { ok: false, code: "not_found" };
  const sourceRow = source as unknown as DuplicateEventSource;

  const title = duplicateEventTitle(String(sourceRow.title ?? ""));
  const base = slugifyEventTitle(title);
  const { data: slugRows, error: slugError } = await admin
    .from("events")
    .select("slug")
    .or(`slug.eq.${base},slug.like.${base}-%`);
  if (slugError) {
    logSupabaseClientError("duplicateEventServer:slug", slugError, { eventId: input.eventId });
    return { ok: false, code: "save_failed" };
  }
  const slug = pickDuplicateEventSlug(
    base,
    new Set((slugRows ?? []).map((row) => String(row.slug))),
  );

  const { data: created, error: insertError } = await admin
    .from("events")
    .insert(buildDuplicateEventInsert(sourceRow, { actorId: input.actorId, slug, title }))
    .select("id")
    .single();
  if (insertError || !created?.id) {
    logSupabaseClientError("duplicateEventServer:insert", insertError ?? { message: "missing id" }, {
      eventId: input.eventId,
    });
    return { ok: false, code: "save_failed" };
  }
  const eventId = String(created.id);
  const copied = await copyEventChildren(admin, input.eventId, eventId, input.actorId);
  if (!copied) {
    await rollback(admin, eventId);
    return { ok: false, code: "save_failed" };
  }
  return { ok: true, eventId };
}

async function copyEventChildren(
  admin: SupabaseClient,
  sourceId: string,
  eventId: string,
  actorId: string,
): Promise<boolean> {
  const [flows, fields, packages, emails, translations] = await Promise.all([
    admin.from("event_registration_flows").select("id, name_i18n, position, price, field_order, archived_at").eq("event_id", sourceId),
    admin.from("event_form_fields").select("field_key, field_type, label_i18n, help_text_i18n, options_i18n, required, position, max_file_size_bytes, allowed_mime_types, archived_at, flow_id, collect_for_companions").eq("event_id", sourceId),
    admin.from("event_ticket_packages").select("name, price, capacity, benefits, position, archived_at").eq("event_id", sourceId),
    admin.from("event_email_templates").select("flow_id, template_key, locale, subject, body_html").eq("event_id", sourceId),
    admin.from("event_translations").select("locale, title, description, location").eq("event_id", sourceId),
  ]);
  const failed = [flows, fields, packages, emails, translations].find((result) => result.error);
  if (failed?.error) {
    logSupabaseClientError("duplicateEventServer:read", failed.error, { eventId: sourceId });
    return false;
  }

  const flowIds = new Map<string, string>();
  for (const flow of flows.data ?? []) {
    const { data, error } = await admin
      .from("event_registration_flows")
      .insert({
        event_id: eventId,
        name_i18n: flow.name_i18n,
        position: flow.position,
        price: flow.price,
        field_order: flow.field_order,
        archived_at: flow.archived_at,
      })
      .select("id")
      .single();
    if (error || !data?.id) {
      logSupabaseClientError("duplicateEventServer:flow", error ?? { message: "missing id" }, { eventId });
      return false;
    }
    flowIds.set(String(flow.id), String(data.id));
  }

  const fieldRows = (fields.data ?? []).map((field) => ({
    event_id: eventId,
    field_key: field.field_key,
    field_type: field.field_type,
    label_i18n: field.label_i18n,
    help_text_i18n: field.help_text_i18n,
    options_i18n: field.options_i18n,
    required: field.required,
    position: field.position,
    max_file_size_bytes: field.max_file_size_bytes,
    allowed_mime_types: field.allowed_mime_types,
    archived_at: field.archived_at,
    flow_id: remapDuplicateFlowId(field.flow_id == null ? null : String(field.flow_id), flowIds),
    collect_for_companions: field.collect_for_companions,
  }));
  const packageRows = (packages.data ?? []).map((row) => ({ ...row, event_id: eventId }));
  const emailRows = (emails.data ?? []).map((row) => ({
    event_id: eventId,
    flow_id: remapDuplicateFlowId(row.flow_id == null ? null : String(row.flow_id), flowIds),
    template_key: row.template_key,
    locale: row.locale,
    subject: row.subject,
    body_html: row.body_html,
    updated_by: actorId,
  }));
  const translationRows = (translations.data ?? []).map((row) => ({
    event_id: eventId,
    locale: row.locale,
    title: duplicateEventTitle(String(row.title ?? "")),
    description: row.description,
    location: row.location,
  }));

  const writes = [
    ["event_form_fields", fieldRows],
    ["event_ticket_packages", packageRows],
    ["event_email_templates", emailRows],
    ["event_translations", translationRows],
  ] as const;
  for (const [table, rows] of writes) {
    if (rows.length === 0) continue;
    const { error } = await admin.from(table).insert(rows);
    if (error) {
      logSupabaseClientError(`duplicateEventServer:${table}`, error, { eventId });
      return false;
    }
  }
  return true;
}
