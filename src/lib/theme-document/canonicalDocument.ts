import type { ThemeDocumentV1 } from "@/lib/theme-document/themeDocumentV1";

export const THEME_DOCUMENT_MAX_BYTES = 262_144;

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (!value || typeof value !== "object") return value;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    sorted[key] = sortValue((value as Record<string, unknown>)[key]);
  }
  return sorted;
}

export function canonicalDocumentJson(doc: ThemeDocumentV1): string {
  return JSON.stringify(sortValue(doc));
}

export async function documentHash(doc: ThemeDocumentV1): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalDocumentJson(doc));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function isDocumentTooLarge(doc: ThemeDocumentV1): boolean {
  return new TextEncoder().encode(canonicalDocumentJson(doc)).byteLength > THEME_DOCUMENT_MAX_BYTES;
}
