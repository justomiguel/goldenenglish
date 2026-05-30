type JsonLike = Record<string, unknown> | unknown[] | string | number | boolean | null;

export type TranslateTextNode = (text: string) => Promise<string>;

async function walk(node: JsonLike, translate: TranslateTextNode): Promise<JsonLike> {
  if (typeof node === "string") return node;
  if (typeof node === "number" || typeof node === "boolean" || node === null) return node;

  if (Array.isArray(node)) {
    const translatedChildren = await Promise.all(node.map((item) => walk(item as JsonLike, translate)));
    return translatedChildren;
  }

  const current = node as Record<string, unknown>;
  if (current.type === "text" && typeof current.text === "string") {
    return {
      ...current,
      text: await translate(current.text),
    };
  }

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(current)) {
    out[key] = await walk(value as JsonLike, translate);
  }
  return out;
}

export async function translateTipTapJson<T extends JsonLike>(
  doc: T,
  translateText: TranslateTextNode,
): Promise<T> {
  const translated = await walk(doc, translateText);
  return translated as T;
}
