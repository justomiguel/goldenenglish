import type { BlogLocale } from "@/lib/blog/domain";
import { defaultLocale } from "@/lib/i18n/dictionaries";

/** Articles are authored in the site native language only (no per-locale editor tabs). */
export function blogEditorNativeLocale(): BlogLocale {
  return defaultLocale as BlogLocale;
}
