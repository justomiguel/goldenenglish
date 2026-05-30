import { normalizeVideoEmbedUrl } from "@/lib/learning-tasks/assets";

export type BlogEmbedDisplay =
  | { mode: "video"; embedUrl: string }
  | { mode: "iframe"; embedUrl: string }
  | { mode: "link"; href: string };

/** Resolves how a blog attachment embed URL should render on the public article page. */
export function resolveBlogEmbedDisplay(url: string): BlogEmbedDisplay {
  const video = normalizeVideoEmbedUrl(url);
  if (video.ok) {
    return { mode: "video", embedUrl: video.embedUrl };
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:") {
      return { mode: "iframe", embedUrl: url };
    }
  } catch {
    // fall through
  }

  return { mode: "link", href: url };
}
