import type { BlogLocale } from "@/lib/blog/domain";

export interface BlogTranslateRequest {
  sourceLocale: BlogLocale;
  targetLocale: BlogLocale;
  html: string;
}

export interface BlogTranslateResult {
  translatedHtml: string;
  translatedPlainText: string;
}
