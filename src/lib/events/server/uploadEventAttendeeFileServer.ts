import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { buildEventAttendeeUploadPath } from "@/lib/events/buildEventAttendeeUploadPath";

export const EVENT_UPLOADS_BUCKET = "event-uploads";

export interface CreateEventUploadSignedUrlInput {
  eventId: string;
  attendeeId: string;
  fieldId: string;
  fileName: string;
  mimeType: string;
}

export interface CreateEventUploadSignedUrlResult {
  path: string;
  token: string;
}

export async function createEventUploadSignedUrl(
  input: CreateEventUploadSignedUrlInput,
): Promise<CreateEventUploadSignedUrlResult | null> {
  const admin = createAdminClient();
  const path = buildEventAttendeeUploadPath({
    eventId: input.eventId,
    attendeeId: input.attendeeId,
    fieldId: input.fieldId,
    filename: input.fileName,
    mime: input.mimeType,
  });

  const { data, error } = await admin.storage
    .from(EVENT_UPLOADS_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data?.token) {
    if (error) {
      logSupabaseClientError("createEventUploadSignedUrl:storage", error, {
        eventId: input.eventId,
        attendeeId: input.attendeeId,
      });
    }
    return null;
  }

  return { path, token: data.token };
}

export async function createEventUploadReadSignedUrl(path: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(EVENT_UPLOADS_BUCKET)
    .createSignedUrl(path, 300);
  if (error || !data?.signedUrl) {
    if (error) logSupabaseClientError("createEventUploadReadSignedUrl:storage", error, { path });
    return null;
  }
  return data.signedUrl;
}
