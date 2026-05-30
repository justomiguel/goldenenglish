import { sanitizeBlogHtml } from "@/lib/blog/sanitizeBlogHtml";

/** Rich event descriptions share the blog HTML allowlist (embeds, files, media). */
export function sanitizeEventDescriptionHtml(input: string): string {
  return sanitizeBlogHtml(input);
}
