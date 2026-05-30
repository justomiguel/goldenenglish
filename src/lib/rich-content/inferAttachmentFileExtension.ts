const KNOWN_EXTENSION_IN_PATH =
  /\.(pdf|docx?|xlsx?|pptx?|txt|rtf|csv|zip|rar|7z|mp3|wav|ogg|m4a|mp4|mov|webm|avi|jpe?g|png|gif|webp|svg|avif)(\?|#|$)/i;

/** Extension from label or URL path (e.g. pdf, docx), lowercase without dot. */
export function inferAttachmentFileExtension(href: string, label: string): string | null {
  const fromName = extractExtension(label);
  if (fromName) return fromName;

  const candidates = [href];
  try {
    candidates.push(decodeURIComponent(href));
  } catch {
    // keep href only
  }

  for (const candidate of candidates) {
    try {
      const pathname = new URL(candidate).pathname;
      const basename = pathname.split("/").pop() ?? "";
      const fromBasename = extractExtension(basename);
      if (fromBasename) return fromBasename;
    } catch {
      // fall through to regex scan
    }

    const fromPath = candidate.match(KNOWN_EXTENSION_IN_PATH);
    if (fromPath?.[1]) return fromPath[1].toLowerCase();
  }

  return null;
}

function extractExtension(value: string): string | null {
  const trimmed = value.trim();
  const match = trimmed.match(/\.([a-z0-9]{1,8})$/i);
  return match?.[1]?.toLowerCase() ?? null;
}
