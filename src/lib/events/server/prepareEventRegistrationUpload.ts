import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { openPublishedEvent } from "@/lib/events/server/openPublishedEvent";
import {
  buildEventFormFieldStagingKey,
  buildEventFormFieldStagingPath,
} from "@/lib/events/buildEventFormFieldStagingPath";
import { validateEventTransferReceiptFile } from "@/lib/events/eventTransferReceiptLimits";
import type { EventFormFieldDefinition } from "@/lib/events/types";
import { validateEventFormFieldFile } from "@/lib/events/validateEventFormFieldFile";
import { EVENT_UPLOADS_BUCKET } from "@/lib/events/eventUploadsBucket";
import { logServerWarn, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { createAdminClient } from "@/lib/supabase/admin";

export type PrepareEventRegistrationUploadResult =
  | { ok: true; path: string; token: string }
  | {
      ok: false;
      code:
        | "invalid_body"
        | "event_not_found"
        | "field_not_found"
        | "invalid_file"
        | "sign_failed";
    };

export async function prepareEventRegistrationUpload(input: {
  slug: string;
  locale: string;
  email: string;
  dniOrPassport: string;
  fileName: string;
  mimeType: string;
  byteSize: number;
  kind: "receipt" | "field";
  fieldId?: string | null;
}): Promise<PrepareEventRegistrationUploadResult> {
  if (!input.email.trim() || !input.dniOrPassport.trim() || !input.fileName.trim()) {
    return { ok: false, code: "invalid_body" };
  }

  const source = await openPublishedEvent(input.slug, input.locale || "es");
  const admin = source?.client ?? (await createAdminClient());
  const event = source?.event ?? null;
  if (!event) return { ok: false, code: "event_not_found" };

  const segment = input.kind === "receipt" ? "receipt" : (input.fieldId ?? "").trim();
  const validated =
    input.kind === "receipt"
      ? validateEventTransferReceiptFile({ size: input.byteSize, type: input.mimeType })
      : validateField(event.fields, segment, input.byteSize, input.mimeType);

  if (!validated) return { ok: false, code: "field_not_found" };
  if (!validated.ok) {
    await logServerWarn("events.prepareRegistrationUpload", {
      reason: "invalid_file",
      code: validated.code,
      kind: input.kind,
    });
    return { ok: false, code: "invalid_file" };
  }

  const path = buildEventFormFieldStagingPath({
    eventId: event.id,
    stagingKey: buildEventFormFieldStagingKey({
      email: input.email,
      dniOrPassport: input.dniOrPassport,
      slug: input.slug,
    }),
    fieldId: segment,
    filename: input.fileName,
    mime: validated.mime,
  });

  const { data, error } = await admin.storage
    .from(EVENT_UPLOADS_BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data?.token) {
    if (error) {
      await logSupabaseClientError("events.prepareRegistrationUpload:sign", error, {
        eventId: event.id,
      });
    }
    return { ok: false, code: "sign_failed" };
  }

  return { ok: true, path, token: data.token };
}

function validateField(
  fields: EventFormFieldDefinition[],
  fieldId: string,
  byteSize: number,
  mimeType: string,
) {
  const field = fields.find((item) => item.id === fieldId);
  if (!field || (field.fieldType !== "file" && field.fieldType !== "image")) return null;
  return validateEventFormFieldFile(field, { size: byteSize, type: mimeType });
}
