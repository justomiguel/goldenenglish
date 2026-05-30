import { prepareEventMediaFileUploadAction } from "@/app/[locale]/dashboard/admin/events/actions";
import { EVENT_MEDIA_BUCKET } from "@/lib/events/eventMedia";
import { createClient } from "@/lib/supabase/client";

export interface UploadedEventMediaRef {
  storagePath: string;
}

export async function performEventMediaFileUpload(
  file: File,
  eventId?: string,
): Promise<UploadedEventMediaRef | null> {
  const prepared = await prepareEventMediaFileUploadAction({
    filename: file.name,
    contentType: file.type,
    byteSize: file.size,
    eventId,
  });
  if (!prepared.ok) return null;
  const upload = await createClient().storage
    .from(EVENT_MEDIA_BUCKET)
    .uploadToSignedUrl(prepared.storagePath, prepared.token, file);
  if (upload.error) return null;
  return { storagePath: prepared.storagePath };
}
