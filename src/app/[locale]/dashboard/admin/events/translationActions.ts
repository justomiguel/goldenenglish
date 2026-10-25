"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { EVENT_LOCALES } from "@/lib/events/domain";
import {
  eventTranslationsToSave,
  SaveEventTranslationsInputSchema,
} from "@/lib/events/eventTranslationsToSave";
import { googleTranslateEventFields } from "@/lib/events/integrations/googleTranslateEventFields";
import { loadGoogleTranslateCredentials } from "@/lib/blog/integrations/google/loadGoogleTranslateCredentials";
import { sanitizeEventDescriptionHtml } from "@/lib/events/sanitizeEventDescriptionHtml";
import {
  logServerActionException,
  logServerAuthzDenied,
  logServerWarn,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

function adminEventsPath(locale: string): string {
  return `/${locale}/dashboard/admin/events`;
}

async function requireAdminActor(): Promise<string | null> {
  try {
    const { user } = await assertAdmin();
    return user.id;
  } catch {
    logServerAuthzDenied("adminEventTranslationAction");
    return null;
  }
}

export async function saveEventTranslationsAction(raw: unknown): Promise<{ ok: boolean; message?: string }> {
  const parsed = SaveEventTranslationsInputSchema.safeParse(raw);
  if (!parsed.success) {
    logServerWarn("saveEventTranslationsAction", {
      reason: "validation",
      fields: parsed.error.issues.map((issue) => issue.path.join(".")),
    });
    return { ok: false, message: "invalid_input" };
  }

  const actorId = await requireAdminActor();
  if (!actorId) return { ok: false, message: "forbidden" };

  const admin = await createAdminClient();
  const { eventId, defaultLocale, translations, adminLocale } = parsed.data;
  const prepared = eventTranslationsToSave(
    translations.map((row) => ({
      locale: row.locale,
      title: row.title,
      description: row.description ?? "",
      location: row.location ?? null,
    })),
    defaultLocale,
  );
  if (!prepared.ok) return { ok: false, message: "invalid_input" };

  const defaultRow = prepared.defaultRow;
  const defaultDescription = sanitizeEventDescriptionHtml(defaultRow.description ?? "");
  const { error: eventError } = await admin
    .from("events")
    .update({
      title: defaultRow.title,
      description: defaultDescription,
      location: defaultRow.location?.trim() || null,
      default_locale: defaultLocale,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);

  if (eventError) {
    logSupabaseClientError("saveEventTranslationsAction:update_event", eventError, { eventId });
    return { ok: false, message: "save_failed" };
  }

  for (const row of prepared.rows) {
    const description = sanitizeEventDescriptionHtml(row.description ?? "");
    const { error } = await admin.from("event_translations").upsert(
      {
        event_id: eventId,
        locale: row.locale,
        title: row.title,
        description,
        location: row.location?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "event_id,locale" },
    );
    if (error) {
      logSupabaseClientError("saveEventTranslationsAction:upsert", error, { eventId, locale: row.locale });
      return { ok: false, message: "save_failed" };
    }
  }

  const { data: slugRow } = await admin.from("events").select("slug").eq("id", eventId).maybeSingle();
  const slug = slugRow?.slug ? String(slugRow.slug) : null;
  revalidatePath(adminEventsPath(adminLocale), "page");
  revalidatePath(`${adminEventsPath(adminLocale)}/${eventId}`, "page");
  for (const locale of EVENT_LOCALES) {
    revalidatePath(`/${locale}/events`, "page");
    if (slug) revalidatePath(`/${locale}/events/${slug}`, "page");
  }
  return { ok: true };
}

const TranslateFieldsSchema = z.object({
  adminLocale: z.string().min(2),
  eventId: z.string().uuid(),
  sourceLocale: z.enum(["es", "en", "pt"]),
  targetLocale: z.enum(["es", "en", "pt"]),
  title: z.string().max(200),
  description: z.string().max(500_000),
  location: z.string().max(300).optional(),
});

export async function translateEventFieldsAdminAction(
  raw: unknown,
): Promise<{ ok: boolean; fields?: { title: string; description: string; location: string | null }; message?: string }> {
  const parsed = TranslateFieldsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "invalid_input" };
  if (parsed.data.sourceLocale === parsed.data.targetLocale) {
    return { ok: false, message: "same_locale" };
  }

  const actorId = await requireAdminActor();
  if (!actorId) return { ok: false, message: "forbidden" };

  try {
    const admin = await createAdminClient();
    const { data: event } = await admin.from("events").select("id").eq("id", parsed.data.eventId).maybeSingle();
    if (!event) return { ok: false, message: "event_not_found" };

    const credentials = await loadGoogleTranslateCredentials(admin);
    if (!credentials.apiKey) return { ok: false, message: "google_key_missing" };

    const fields = await googleTranslateEventFields({
      apiKey: credentials.apiKey,
      sourceLocale: parsed.data.sourceLocale,
      targetLocale: parsed.data.targetLocale,
      title: parsed.data.title,
      description: parsed.data.description,
      location: parsed.data.location,
    });

    await admin.from("user_events").insert({
      user_id: actorId,
      event_type: "action",
      entity: "route:/dashboard/admin/events",
      metadata: {
        kind: "event_translate_fields",
        eventId: parsed.data.eventId,
        sourceLocale: parsed.data.sourceLocale,
        targetLocale: parsed.data.targetLocale,
      },
    });

    return { ok: true, fields };
  } catch (error) {
    logServerActionException("translateEventFieldsAdminAction", error, {
      eventId: parsed.data.eventId,
    });
    return { ok: false, message: "unexpected_error" };
  }
}
