const FIRST_IMG_PARAGRAPH = /<p(?:\s[^>]*)?>\s*<img\b[^>]*\/?>\s*<\/p>/i;
const FIRST_IMG_TAG = /<img\b[^>]*\/?>/i;

/** Removes the first inline image so it is not shown twice when used as cover/hero. SSR-safe. */
export function stripFirstImageFromHtml(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return trimmed;

  const withoutParagraph = trimmed.replace(FIRST_IMG_PARAGRAPH, "").trim();
  if (withoutParagraph !== trimmed) return withoutParagraph;

  return trimmed.replace(FIRST_IMG_TAG, "").trim();
}
