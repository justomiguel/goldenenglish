export function parseEventFormFieldAllowedMimeTypes(raw: string): string[] {
  const seen = new Set<string>();
  const values: string[] = [];

  for (const part of raw.split(",")) {
    const mime = part.trim().toLowerCase();
    if (!mime || seen.has(mime)) continue;
    seen.add(mime);
    values.push(mime);
  }

  return values;
}
