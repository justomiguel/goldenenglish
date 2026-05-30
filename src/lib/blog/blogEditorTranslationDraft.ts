import type { AdminGlobalDraftMaterial } from "@/components/admin/AdminGlobalContentMaterialsPanel";
import { BLOG_LOCALES, type BlogLocale } from "@/lib/blog/domain";
import { htmlToPlain } from "@/lib/blog/htmlToPlain";
import { normalizeSlug } from "@/lib/blog/slug";

export interface BlogEditorTranslationDraft {
  title: string;
  excerpt: string;
  bodyHtml: string;
  materials: AdminGlobalDraftMaterial[];
}

export type BlogEditorTranslationsByLocale = Record<BlogLocale, BlogEditorTranslationDraft>;

export function emptyBlogEditorTranslationDraft(): BlogEditorTranslationDraft {
  return { title: "", excerpt: "", bodyHtml: "<p></p>", materials: [] };
}

export function createBlogEditorTranslationsMap(
  seed?: Partial<Record<BlogLocale, Partial<BlogEditorTranslationDraft>>>,
): BlogEditorTranslationsByLocale {
  const map = {} as BlogEditorTranslationsByLocale;
  for (const locale of BLOG_LOCALES) {
    const fromSeed = seed?.[locale];
    map[locale] = {
      title: fromSeed?.title ?? "",
      excerpt: fromSeed?.excerpt ?? "",
      bodyHtml: fromSeed?.bodyHtml?.trim() ? fromSeed.bodyHtml : "<p></p>",
      materials: fromSeed?.materials ?? [],
    };
  }
  return map;
}

export function isBlogTranslationSavable(draft: BlogEditorTranslationDraft): boolean {
  if (!draft.title.trim()) return false;
  return htmlToPlain(draft.bodyHtml).trim().length > 0;
}

export function buildSavableBlogTranslations(
  map: BlogEditorTranslationsByLocale,
): Array<BlogEditorTranslationDraft & { locale: BlogLocale; slug: string }> {
  const rows: Array<BlogEditorTranslationDraft & { locale: BlogLocale; slug: string }> = [];
  for (const locale of BLOG_LOCALES) {
    const draft = map[locale];
    if (!isBlogTranslationSavable(draft)) continue;
    rows.push({
      locale,
      ...draft,
      slug: normalizeSlug(draft.title) || locale,
    });
  }
  return rows;
}

export function otherBlogLocales(locale: BlogLocale): BlogLocale[] {
  return BLOG_LOCALES.filter((item) => item !== locale);
}
