import { prepareEventMediaFileUploadAction } from "@/app/[locale]/dashboard/admin/events/eventAttendeeActions";
import { emailImageHtml } from "@/lib/email/emailMediaHtml";
import { uploadFileToSignedUrlWithProgress } from "@/lib/client/uploadFileToSignedUrlWithProgress";
import { EVENT_MEDIA_BUCKET, eventMediaPublicUrl } from "@/lib/events/eventMedia";
import { readSupabasePublicEnv } from "@/lib/supabase/publicEnv";

export const EMAIL_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

const EMAIL_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function uploadEmailTemplateImage(input: {
  file: File;
  onProgress?: (phase: "preparing" | "sending", value?: number) => void;
}): Promise<string | null> {
  if (!EMAIL_IMAGE_TYPES.has(input.file.type) || input.file.size < 1 || input.file.size > EMAIL_IMAGE_MAX_BYTES) {
    return null;
  }
  input.onProgress?.("preparing");
  const prepared = await prepareEventMediaFileUploadAction({
    filename: input.file.name || "image",
    contentType: input.file.type,
    byteSize: input.file.size,
  });
  if (!prepared.ok) return null;

  const { url } = readSupabasePublicEnv();
  if (!url) return null;
  try {
    await uploadFileToSignedUrlWithProgress({
      supabaseUrl: url,
      bucket: EVENT_MEDIA_BUCKET,
      storagePath: prepared.storagePath,
      token: prepared.token,
      file: input.file,
      onProgress: (value) => input.onProgress?.("sending", value),
    });
  } catch {
    return null;
  }
  const alt = input.file.name.replace(/\.[^.]+$/, "") || "image";
  return emailImageHtml({ src: eventMediaPublicUrl(url, prepared.storagePath), alt });
}
