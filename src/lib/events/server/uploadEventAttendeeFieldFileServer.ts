import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { loadEventForPublicLanding } from "@/lib/dashboard/events/loadEventForPublicLanding";
import {
  buildEventFormFieldStagingKey,
  buildEventFormFieldStagingPath,
} from "@/lib/events/buildEventFormFieldStagingPath";
import { validateEventFormFieldFile } from "@/lib/events/validateEventFormFieldFile";
import { logSupabaseClientError, logServerWarn } from "@/lib/logging/serverActionLog";
import { EVENT_UPLOADS_BUCKET } from "@/lib/events/server/uploadEventAttendeeFileServer";

export interface UploadEventAttendeeFieldFileServerInput {
  slug: string;
  locale: string;
  fieldId: string;
  email: string;
  dniOrPassport: string;
  fileName: string;
  fileBytes: Buffer;
  fileMime: string;
}

export type UploadEventAttendeeFieldFileServerResult =
  | { ok: true; path: string; fileSizeBytes: number; fileMimeType: string }
  | {
      ok: false;
      code:
        | "invalid_body"
        | "event_not_found"
        | "field_not_found"
        | "invalid_file"
        | "storage_failed";
    };

export async function uploadEventAttendeeFieldFileServer(
  input: UploadEventAttendeeFieldFileServerInput,
): Promise<UploadEventAttendeeFieldFileServerResult> {
  const admin = createAdminClient();
  const event = await loadEventForPublicLanding(admin, input.slug, input.locale);
  if (!event) {
    return { ok: false, code: "event_not_found" };
  }

  const field = event.fields.find((item) => item.id === input.fieldId);
  if (!field || (field.fieldType !== "file" && field.fieldType !== "image")) {
    return { ok: false, code: "field_not_found" };
  }

  const validated = validateEventFormFieldFile(field, {
    size: input.fileBytes.byteLength,
    type: input.fileMime,
  });
  if (!validated.ok) {
    logServerWarn("uploadEventAttendeeFieldFileServer:invalid_file", {
      fieldId: input.fieldId,
      code: validated.code,
    });
    return { ok: false, code: "invalid_file" };
  }

  const stagingKey = buildEventFormFieldStagingKey({
    email: input.email,
    dniOrPassport: input.dniOrPassport,
    slug: input.slug,
  });
  const path = buildEventFormFieldStagingPath({
    eventId: event.id,
    stagingKey,
    fieldId: input.fieldId,
    filename: input.fileName,
    mime: validated.mime,
  });

  const { error } = await admin.storage.from(EVENT_UPLOADS_BUCKET).upload(path, input.fileBytes, {
    contentType: validated.mime,
    upsert: true,
  });

  if (error) {
    logSupabaseClientError("uploadEventAttendeeFieldFileServer:storage", error, {
      fieldId: input.fieldId,
      eventId: event.id,
    });
    return { ok: false, code: "storage_failed" };
  }

  return {
    ok: true,
    path,
    fileSizeBytes: input.fileBytes.byteLength,
    fileMimeType: validated.mime,
  };
}
