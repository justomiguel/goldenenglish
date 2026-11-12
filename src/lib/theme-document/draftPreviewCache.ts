import { locales } from "@/lib/i18n/dictionaries";

export const DRAFT_PREVIEW_CACHE_CONTROL = "private, no-store";

const draftPreviewPath = new RegExp(`^\\/(?:${locales.join("|")})\\/plantilla\\/borrador$`);

export function isDraftPreviewPath(pathname: string): boolean {
  return draftPreviewPath.test(pathname);
}

export function applyDraftPreviewCache(
  pathname: string,
  response: { headers: { set: (name: string, value: string) => void } },
): void {
  if (!isDraftPreviewPath(pathname)) return;
  response.headers.set("Cache-Control", DRAFT_PREVIEW_CACHE_CONTROL);
}
