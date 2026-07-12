/** Basename and image detection for event-uploads storage paths. */

const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|avif)$/i;

export function basenameFromStoragePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "";
  const parts = trimmed.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? trimmed;
}

export function isLikelyImageStoragePath(path: string): boolean {
  return IMAGE_EXT_RE.test(basenameFromStoragePath(path));
}

export function shouldRenderEventFieldAsImage(
  fieldType: string | undefined,
  fileStoragePath: string | null | undefined,
): boolean {
  const path = fileStoragePath?.trim();
  if (!path) return false;
  if (fieldType === "image") return true;
  if (fieldType === "file") return isLikelyImageStoragePath(path);
  return false;
}

export function extensionForEventUploadImage(path: string): "jpeg" | "png" | "gif" | "webp" | null {
  const base = basenameFromStoragePath(path).toLowerCase();
  if (base.endsWith(".jpg") || base.endsWith(".jpeg")) return "jpeg";
  if (base.endsWith(".png")) return "png";
  if (base.endsWith(".gif")) return "gif";
  if (base.endsWith(".webp") || base.endsWith(".avif")) return "webp";
  return null;
}

export function mimeForEventUploadImageExt(ext: "jpeg" | "png" | "gif" | "webp"): string {
  if (ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "gif") return "image/gif";
  return "image/webp";
}
