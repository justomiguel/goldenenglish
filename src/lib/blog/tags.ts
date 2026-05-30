import { normalizeSlug } from "@/lib/blog/slug";

export const BLOG_TAG_MAX = 30;

export function normalizeTag(input: string): string {
  const withoutHash = input.replace(/^#+/, "");
  return normalizeSlug(withoutHash);
}

export function normalizeTags(tags: readonly string[]): string[] {
  const unique = new Set<string>();
  for (const raw of tags) {
    const normalized = normalizeTag(raw);
    if (normalized.length === 0) continue;
    unique.add(normalized);
    if (unique.size >= BLOG_TAG_MAX) break;
  }
  return Array.from(unique);
}
