import type { ContentEmbedProvider } from "@/lib/learning-tasks/types";

export const LEARNING_TASK_ASSET_BUCKET = "learning-task-assets";
export const LEARNING_TASK_MAX_FILE_BYTES = 50 * 1024 * 1024;

export const LEARNING_TASK_ACCEPTED_MIME = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "video/mp4",
  "video/webm",
] as const;

export type LearningTaskAcceptedMime = (typeof LEARNING_TASK_ACCEPTED_MIME)[number];
export type LearningTaskFileValidationCode = "file_too_large" | "mime_invalid";

export function isAcceptedLearningTaskMime(value: string): value is LearningTaskAcceptedMime {
  return (LEARNING_TASK_ACCEPTED_MIME as readonly string[]).includes(value);
}

export function validateLearningTaskFile(file: {
  name: string;
  size: number;
  type: string;
}): { ok: true; mime: LearningTaskAcceptedMime } | { ok: false; code: LearningTaskFileValidationCode } {
  if (file.size > LEARNING_TASK_MAX_FILE_BYTES) return { ok: false, code: "file_too_large" };
  if (!isAcceptedLearningTaskMime(file.type)) return { ok: false, code: "mime_invalid" };
  return { ok: true, mime: file.type };
}

export function extensionForLearningTaskMime(mime: LearningTaskAcceptedMime): string {
  const map: Record<LearningTaskAcceptedMime, string> = {
    "application/pdf": "pdf",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/webm": "webm",
  };
  return map[mime];
}

export function normalizeVideoEmbedUrl(
  rawUrl: string,
): { ok: true; provider: ContentEmbedProvider; embedUrl: string } | { ok: false; code: "embed_url_invalid" } {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, code: "embed_url_invalid" };
  }

  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id ? { ok: true, provider: "youtube", embedUrl: `https://www.youtube.com/embed/${id}` } : { ok: false, code: "embed_url_invalid" };
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    const id = url.searchParams.get("v") ?? url.pathname.split("/").filter(Boolean).pop();
    return id ? { ok: true, provider: "youtube", embedUrl: `https://www.youtube.com/embed/${id}` } : { ok: false, code: "embed_url_invalid" };
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean).pop();
    return id && /^\d+$/.test(id)
      ? { ok: true, provider: "vimeo", embedUrl: `https://player.vimeo.com/video/${id}` }
      : { ok: false, code: "embed_url_invalid" };
  }
  return { ok: false, code: "embed_url_invalid" };
}
