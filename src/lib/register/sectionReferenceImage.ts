import { readSupabasePublicEnv } from "@/lib/supabase/publicEnv";

export const SECTION_IMAGES_BUCKET = "section-images" as const;
export const SECTION_SHARE_FALLBACK_PATH = "/images/section-share-fallback.png";
export const MAX_SECTION_IMAGE_BYTES = 1024 * 1024 * 2;

export const ALLOWED_SECTION_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function isAllowedSectionImageUpload(mime: string, size: number): boolean {
  return ALLOWED_SECTION_IMAGE_MIME.has(mime) && size > 0 && size <= MAX_SECTION_IMAGE_BYTES;
}

export function sectionReferenceImageExt(mime: string): "jpg" | "png" | "webp" | null {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return null;
}

export function sectionReferenceImagePublicUrl(
  path: string | null | undefined,
): string | null {
  if (typeof path !== "string") return null;
  const trimmed = path.trim();
  if (trimmed.length === 0) return null;
  const envUrl = readSupabasePublicEnv().url.trim();
  if (!envUrl) return null;
  const base = envUrl.replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${SECTION_IMAGES_BUCKET}/${encodePath(trimmed)}`;
}

function encodePath(p: string): string {
  return p
    .split("/")
    .filter((seg) => seg.length > 0)
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}
