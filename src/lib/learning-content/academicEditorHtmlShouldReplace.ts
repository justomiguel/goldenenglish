const MEDIA_URL = /https:\/\/[^"'\s>]+/gi;

function mediaUrls(html: string): string[] {
  return [...html.matchAll(MEDIA_URL)].map((match) => match[0]);
}

/** False when applying `incoming` would drop https media already in the live editor. */
export function academicEditorHtmlShouldReplace(current: string, incoming: string): boolean {
  const currentUrls = mediaUrls(current);
  if (currentUrls.length === 0) return true;
  return currentUrls.every((url) => incoming.includes(url));
}
