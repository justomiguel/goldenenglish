/**
 * Collapses leading/trailing empty block markup (TipTap trailing `<p><br></p>`, Word paste, etc.)
 * so read-only prose regions don't reserve large vertical gaps. Display-only; run after sanitize.
 */
export function collapseRichTextDisplayHtml(input: string): string {
  let html = input.trim();
  if (!html) return "";

  const emptyParagraph = String.raw`<p\b[^>]*>\s*(?:(?:<br\b[^>]*\/?>|&nbsp;|&#160;|\u00a0)\s*)*<\/p>`;
  const trailing = new RegExp(`(?:${emptyParagraph}\\s*)+$`, "gi");
  const leading = new RegExp(`^(?:\\s*${emptyParagraph})+`, "gi");

  let prev = "";
  while (prev !== html) {
    prev = html;
    html = html.replace(trailing, "").trim();
  }
  prev = "";
  while (prev !== html) {
    prev = html;
    html = html.replace(leading, "").trim();
  }

  return html;
}
