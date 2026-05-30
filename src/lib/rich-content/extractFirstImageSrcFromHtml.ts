const FIRST_IMG_TAG = /<img\b[^>]*>/i;

function readSrcFromImgTag(tag: string): string | null {
  const quoted = tag.match(/\bsrc\s*=\s*(["'])(.*?)\1/i);
  if (quoted?.[2]) return quoted[2].trim();
  const unquoted = tag.match(/\bsrc\s*=\s*([^\s>"']+)/i);
  return unquoted?.[1]?.trim() ?? null;
}

/** First `<img src>` in rich HTML (description / article body). Skips data URLs. SSR-safe. */
export function extractFirstImageSrcFromHtml(html: string): string | null {
  const trimmed = html.trim();
  if (!trimmed) return null;

  const tagMatch = trimmed.match(FIRST_IMG_TAG);
  if (!tagMatch) return null;

  const src = readSrcFromImgTag(tagMatch[0]);
  if (!src || src.startsWith("data:")) return null;
  return src;
}
