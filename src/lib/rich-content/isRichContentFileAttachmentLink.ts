import { inferAttachmentFileExtension } from "@/lib/rich-content/inferAttachmentFileExtension";

const SUPABASE_PUBLIC_MEDIA =
  /\/storage\/v1\/object\/public\/(?:blog-media|event-media)\//i;

export function extractHtmlAttribute(attrs: string, name: string): string | null {
  const re = new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, "i");
  const match = attrs.match(re);
  return match?.[2]?.trim() ?? null;
}

/** Plain label from anchor inner HTML (TipTap may wrap the filename in marks). */
export function stripRichAnchorLabel(innerHtml: string): string {
  return innerHtml
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** Detects editor-uploaded file links (not inline prose hyperlinks). */
export function isRichContentFileAttachmentLink(
  href: string,
  attrs: string,
  innerHtml: string,
): boolean {
  const label = stripRichAnchorLabel(innerHtml);

  if (SUPABASE_PUBLIC_MEDIA.test(href)) return true;
  if (inferAttachmentFileExtension(href, label)) return true;

  const target = extractHtmlAttribute(attrs, "target");
  const rel = extractHtmlAttribute(attrs, "rel") ?? "";
  if (target === "_blank" && /noopener/i.test(rel)) return true;

  return target === "_blank" && FILE_PATH_EXTENSION.test(href);
}

const FILE_PATH_EXTENSION =
  /\.(pdf|docx?|xlsx?|pptx?|txt|rtf|csv|zip|rar|7z|mp3|wav|ogg|m4a|mp4|mov|webm|avi)(\?|#|$)/i;
