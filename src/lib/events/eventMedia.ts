import {
  extensionForLearningTaskMime,
  type LearningTaskAcceptedMime,
} from "@/lib/learning-tasks/assets";

export const EVENT_MEDIA_BUCKET = "event-media";

export function buildEventMediaStoragePath(input: {
  eventId?: string;
  actorId: string;
  mime: LearningTaskAcceptedMime;
}): string {
  const ext = extensionForLearningTaskMime(input.mime);
  const id = crypto.randomUUID();
  const scope = input.eventId ? `events/${input.eventId}` : `drafts/${input.actorId}`;
  return `${scope}/${id}.${ext}`;
}

export function eventMediaPublicUrl(supabaseProjectUrl: string, storagePath: string): string {
  const base = supabaseProjectUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${EVENT_MEDIA_BUCKET}/${storagePath}`;
}
