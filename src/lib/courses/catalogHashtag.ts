const HASHTAG_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/;

export function normalizeHashtag(raw: string): string | null {
  const folded = raw
    .trim()
    .replace(/^#+/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "");
  if (!HASHTAG_PATTERN.test(folded)) return null;
  return folded;
}

export function parseHashtagList(raw: string): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const part of raw.split(/[\s,]+/)) {
    const label = normalizeHashtag(part);
    if (!label || seen.has(label)) continue;
    seen.add(label);
    labels.push(label);
    if (labels.length === 10) break;
  }
  return labels;
}
