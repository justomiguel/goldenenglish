import { getEmbedUrlFromYoutubeUrl, isValidYoutubeUrl } from "@tiptap/extension-youtube";

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** HTML snippet to insert at cursor after uploading blog-media. */
export function buildBlogMediaInsertHtml(input: {
  url: string;
  label: string;
  contentType: string;
}): string {
  const url = escapeAttr(input.url);
  const label = escapeText(input.label);

  if (input.contentType.startsWith("image/")) {
    return `<p><img src="${url}" alt="${escapeAttr(input.label)}" /></p>`;
  }
  if (input.contentType.startsWith("audio/")) {
    return `<p><audio controls preload="metadata" src="${url}"></audio></p>`;
  }
  if (input.contentType.startsWith("video/")) {
    return `<p><video controls preload="metadata" src="${url}"></video></p>`;
  }
  return `<p><a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a></p>`;
}

/** HTML snippet for YouTube embeds — matches AcademicYoutube (720×405, nocookie). */
export function buildBlogYoutubeInsertHtml(url: string): string | null {
  const trimmed = url.trim();
  if (!isValidYoutubeUrl(trimmed)) return null;
  const embedUrl = getEmbedUrlFromYoutubeUrl({
    url: trimmed,
    controls: true,
    nocookie: true,
  });
  if (!embedUrl) return null;
  const src = escapeAttr(embedUrl);
  return `<div data-youtube-video=""><iframe src="${src}" width="720" height="405" allowfullscreen="true"></iframe></div>`;
}
