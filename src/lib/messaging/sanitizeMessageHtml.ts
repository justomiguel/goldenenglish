import sanitizeHtml from "sanitize-html";

/**
 * Rich-text subset aligned with TipTap StarterKit: block/inline structure only,
 * no attributes (no `href`, `style`, `on*`) to reduce XSS surface.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
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
  ],
  allowedAttributes: {},
  allowedSchemes: [],
};

export function sanitizeMessageHtml(html: string): string {
  return sanitizeHtml(html, OPTIONS);
}
