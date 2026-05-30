/** First `<p>…</p>` block in a slice (non-global — one paragraph at a time). */
const PARAGRAPH_BLOCK = /<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/i;

export function normalizeRichParagraphInner(inner: string): string {
  return inner
    .replace(/(?:<br\b[^>]*\/?>|&nbsp;|\u00a0)+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchRichContentParagraphBlock(
  slice: string,
): { index: number; length: number; inner: string } | null {
  const match = slice.match(PARAGRAPH_BLOCK);
  if (match?.index == null) return null;

  return {
    index: match.index,
    length: match[0].length,
    inner: match[1],
  };
}

export function forEachRichContentParagraphBlock(
  slice: string,
  visit: (block: { index: number; length: number; inner: string }) => void,
): void {
  let offset = 0;
  while (offset < slice.length) {
    const block = matchRichContentParagraphBlock(slice.slice(offset));
    if (!block) break;
    visit({
      index: offset + block.index,
      length: block.length,
      inner: block.inner,
    });
    offset += block.index + block.length;
  }
}
