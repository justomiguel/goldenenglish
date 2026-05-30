/** Appends a media snippet (from buildBlogMediaInsertHtml / buildBlogYoutubeInsertHtml) to rich HTML body. */
export function appendRichEditorMediaHtml(bodyHtml: string, insertHtml: string): string {
  const trimmed = bodyHtml.trim();
  if (!trimmed || trimmed === "<p></p>") return insertHtml;
  return `${trimmed}${insertHtml}`;
}
