import { appendRichEditorMediaHtml } from "@/lib/learning-content/appendRichEditorMediaHtml";

function parseRoot(bodyHtml: string): HTMLElement | null {
  const trimmed = bodyHtml.trim();
  const doc = new DOMParser().parseFromString(
    `<div id="ge-root">${trimmed || "<p></p>"}</div>`,
    "text/html",
  );
  return doc.getElementById("ge-root");
}

function isInlineImageInsert(insertHtml: string): boolean {
  return /^<p>\s*<img[\s/>]/i.test(insertHtml.trim());
}

/** Inserts a media snippet at the same top-level block anchor across locale HTML copies. */
export function insertRichEditorMediaAtBlockIndex(
  bodyHtml: string,
  blockIndex: number,
  insertHtml: string,
): string {
  const trimmed = bodyHtml.trim();
  if (!trimmed || trimmed === "<p></p>") return insertHtml;

  const root = parseRoot(trimmed);
  if (!root) return appendRichEditorMediaHtml(bodyHtml, insertHtml);

  const blocks = Array.from(root.children);
  if (blocks.length === 0) return appendRichEditorMediaHtml(bodyHtml, insertHtml);

  const safeIndex = Math.min(Math.max(blockIndex, 0), blocks.length - 1);

  if (isInlineImageInsert(insertHtml)) {
    const imgDoc = new DOMParser().parseFromString(insertHtml, "text/html");
    const img = imgDoc.querySelector("img");
    const target = blocks[safeIndex];
    if (img && target?.tagName === "P") {
      target.appendChild(root.ownerDocument.importNode(img, true));
      return root.innerHTML;
    }
  }

  const fragDoc = new DOMParser().parseFromString(
    `<div id="ge-frag">${insertHtml}</div>`,
    "text/html",
  );
  const fragRoot = fragDoc.getElementById("ge-frag");
  if (!fragRoot) return appendRichEditorMediaHtml(bodyHtml, insertHtml);

  const insertNodes = Array.from(fragRoot.childNodes).map((node) =>
    root.ownerDocument.importNode(node, true),
  );
  const insertBeforeIndex = Math.min(safeIndex + 1, blocks.length);
  const ref = blocks[insertBeforeIndex] ?? null;
  if (ref) {
    insertNodes.forEach((node) => root.insertBefore(node, ref));
  } else {
    insertNodes.forEach((node) => root.appendChild(node));
  }
  return root.innerHTML;
}

export function applyMediaInsertToAllLocaleBodies<
  T extends string,
  R extends { bodyHtml: string },
>(
  map: Record<T, R>,
  locales: readonly T[],
  blockIndex: number,
  insertHtml: string,
): Record<T, R> {
  const next = { ...map };
  for (const locale of locales) {
    next[locale] = {
      ...next[locale],
      bodyHtml: insertRichEditorMediaAtBlockIndex(next[locale].bodyHtml, blockIndex, insertHtml),
    };
  }
  return next;
}

/** Same anchor insert for sibling locales; active locale is updated live in TipTap. */
export function applyMediaInsertToOtherLocaleBodies<
  T extends string,
  R extends { bodyHtml: string },
>(
  map: Record<T, R>,
  locales: readonly T[],
  skipLocale: T,
  blockIndex: number,
  insertHtml: string,
): Record<T, R> {
  const next = { ...map };
  for (const locale of locales) {
    if (locale === skipLocale) continue;
    next[locale] = {
      ...next[locale],
      bodyHtml: insertRichEditorMediaAtBlockIndex(next[locale].bodyHtml, blockIndex, insertHtml),
    };
  }
  return next;
}

export function applyMediaInsertToAllEventDescriptions<
  T extends string,
  R extends { description: string },
>(
  map: Record<T, R>,
  locales: readonly T[],
  blockIndex: number,
  insertHtml: string,
): Record<T, R> {
  const next = { ...map };
  for (const locale of locales) {
    next[locale] = {
      ...next[locale],
      description: insertRichEditorMediaAtBlockIndex(next[locale].description, blockIndex, insertHtml),
    };
  }
  return next;
}

/** Same anchor insert for sibling locales; active locale is updated live in TipTap. */
export function applyMediaInsertToOtherEventDescriptions<
  T extends string,
  R extends { description: string },
>(
  map: Record<T, R>,
  locales: readonly T[],
  skipLocale: T,
  blockIndex: number,
  insertHtml: string,
): Record<T, R> {
  const next = { ...map };
  for (const locale of locales) {
    if (locale === skipLocale) continue;
    next[locale] = {
      ...next[locale],
      description: insertRichEditorMediaAtBlockIndex(next[locale].description, blockIndex, insertHtml),
    };
  }
  return next;
}
