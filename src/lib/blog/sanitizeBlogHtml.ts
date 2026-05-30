import sanitizeHtml from "sanitize-html";

const BLOG_ALLOWED_IFRAME_HOSTNAMES = [
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "youtube-nocookie.com",
  "player.vimeo.com",
];

const BLOG_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "strike",
    "code",
    "pre",
    "blockquote",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "a",
    "img",
    "audio",
    "video",
    "source",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "iframe",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "title"],
    audio: ["src", "controls", "preload"],
    video: ["src", "controls", "preload", "poster"],
    source: ["src", "type"],
    th: ["colspan", "rowspan"],
    td: ["colspan", "rowspan"],
    iframe: ["src", "title", "allowfullscreen", "frameborder"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: {
    img: ["http", "https"],
  },
  allowedIframeHostnames: BLOG_ALLOWED_IFRAME_HOSTNAMES,
  exclusiveFilter(frame) {
    if (frame.tag !== "iframe") return false;
    return !frame.attribs.src;
  },
  disallowedTagsMode: "discard",
};

export function sanitizeBlogHtml(input: string): string {
  return sanitizeHtml(input, BLOG_SANITIZE_OPTIONS).trim();
}
