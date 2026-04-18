import sanitizeHtml from "sanitize-html";

/**
 * Email-safe HTML allowlist for admin-editable templates persisted in
 * `email_templates.body_html` and later rendered in branded outbound emails.
 *
 * It is intentionally **more permissive** than `sanitizeMessageHtml` (used
 * for portal messages) because email templates legitimately need:
 *
 *  - inline `style` (mail clients ignore external CSS)
 *  - `<a href="…">` for action links and `mailto:` / `tel:`
 *  - layout helpers (`div`, `span`, `table`) the templating engine emits
 *
 * It is intentionally **far stricter** than "trust the admin": no
 * `<script>` / `<iframe>` / `<object>` / `<embed>`, no `on*` handlers, no
 * `javascript:` / `vbscript:` / `data:` URLs, no remote `<style>` blocks.
 *
 * Acts as the persistence-boundary defense for OWASP A03 (Injection) /
 * A08 (Software & Data Integrity Failures): even if an admin account is
 * compromised, the worst they can persist is "weird styled text", not a
 * stored XSS that reaches every recipient mailbox.
 */
const OPTIONS: sanitizeHtml.IOptions = {
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
    "span",
    "div",
    "img",
    "table",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "th",
    "td",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "style"],
    img: ["src", "alt", "width", "height", "style"],
    "*": ["style", "class", "align"],
    table: ["border", "cellpadding", "cellspacing", "width", "style", "class"],
    th: ["colspan", "rowspan", "style", "class", "align"],
    td: ["colspan", "rowspan", "style", "class", "align"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesAppliedToAttributes: ["href", "src"],
  allowProtocolRelative: false,
  /**
   * Drop `style` declarations that smell like script execution vectors:
   * `url('javascript:…')`, IE legacy `expression(…)`, vbscript:, etc.
   */
  allowedStyles: {
    "*": {
      // Only allow safe CSS values (alphanumerics, common punctuation, %, #, parens for rgb()).
      // Anything containing `javascript`, `expression`, `vbscript` is rejected by failing the regex.
      color: [/^(?!.*(javascript|expression|vbscript)).*$/i],
      "background-color": [/^(?!.*(javascript|expression|vbscript)).*$/i],
      background: [/^(?!.*(javascript|expression|vbscript|url\s*\()).*$/i],
      "font-size": [/^[\w%.\-]+$/],
      "font-weight": [/^[\w-]+$/],
      "font-family": [/^[\w\s,'"\-]+$/],
      "text-align": [/^(left|right|center|justify)$/i],
      "line-height": [/^[\w%.\-]+$/],
      margin: [/^[\w%.\s\-]+$/],
      "margin-top": [/^[\w%.\-]+$/],
      "margin-bottom": [/^[\w%.\-]+$/],
      "margin-left": [/^[\w%.\-]+$/],
      "margin-right": [/^[\w%.\-]+$/],
      padding: [/^[\w%.\s\-]+$/],
      "padding-top": [/^[\w%.\-]+$/],
      "padding-bottom": [/^[\w%.\-]+$/],
      "padding-left": [/^[\w%.\-]+$/],
      "padding-right": [/^[\w%.\-]+$/],
      border: [/^[\w%.\s#\-]+$/],
      "border-radius": [/^[\w%.\-]+$/],
      width: [/^[\w%.\-]+$/],
      "max-width": [/^[\w%.\-]+$/],
      "min-width": [/^[\w%.\-]+$/],
      height: [/^[\w%.\-]+$/],
      display: [/^[\w-]+$/],
    },
  },
};

export function sanitizeEmailTemplateHtml(html: string): string {
  if (!html) return "";
  return sanitizeHtml(html, OPTIONS);
}
