"use client";

import { useCallback, useMemo, useState } from "react";
import {
  buildSavableBlogTranslations,
  createBlogEditorTranslationsMap,
  isBlogTranslationSavable,
  type BlogEditorTranslationDraft,
} from "@/lib/blog/blogEditorTranslationDraft";
import type { AdminGlobalDraftMaterial } from "@/components/admin/AdminGlobalContentMaterialsPanel";
import { applyMediaInsertToOtherLocaleBodies } from "@/lib/learning-content/insertRichEditorMediaAtBlockIndex";
import type { MediaSyncToAllLocalesPayload } from "@/lib/learning-content/insertAcademicEditorMedia";
import { BLOG_LOCALES, type BlogLocale } from "@/lib/blog/domain";

interface UseBlogArticleEditorLocalesInput {
  startLocale: BlogLocale;
  seed?: Partial<Record<BlogLocale, Partial<BlogEditorTranslationDraft>>>;
}

export function useBlogArticleEditorLocales({
  startLocale,
  seed,
}: UseBlogArticleEditorLocalesInput) {
  const [translationsMap, setTranslationsMap] = useState(() =>
    createBlogEditorTranslationsMap(seed),
  );
  const [editingLocale, setEditingLocale] = useState<BlogLocale>(startLocale);

  const currentDraft = translationsMap[editingLocale];

  const patchCurrentDraft = useCallback(
    (patch: Partial<BlogEditorTranslationDraft>) => {
      setTranslationsMap((prev) => ({
        ...prev,
        [editingLocale]: { ...prev[editingLocale], ...patch },
      }));
    },
    [editingLocale],
  );

  const setTitle = useCallback(
    (title: string) => patchCurrentDraft({ title }),
    [patchCurrentDraft],
  );
  const setExcerpt = useCallback(
    (excerpt: string) => patchCurrentDraft({ excerpt }),
    [patchCurrentDraft],
  );
  const setBodyHtml = useCallback(
    (bodyHtml: string) => patchCurrentDraft({ bodyHtml }),
    [patchCurrentDraft],
  );
  const setMaterials = useCallback(
    (materials: BlogEditorTranslationDraft["materials"]) => patchCurrentDraft({ materials }),
    [patchCurrentDraft],
  );

  const syncMediaToAllLocales = useCallback(
    ({ insertHtml, blockIndex }: MediaSyncToAllLocalesPayload) => {
      setTranslationsMap((prev) =>
        applyMediaInsertToOtherLocaleBodies(
          prev,
          BLOG_LOCALES,
          editingLocale,
          blockIndex,
          insertHtml,
        ),
      );
    },
    [editingLocale],
  );

  const appendMaterialToAllLocales = useCallback((material: AdminGlobalDraftMaterial) => {
    setTranslationsMap((prev) => {
      const next = { ...prev };
      for (const locale of BLOG_LOCALES) {
        next[locale] = {
          ...next[locale],
          materials: [...next[locale].materials, { ...material, id: crypto.randomUUID() }],
        };
      }
      return next;
    });
  }, []);

  const switchEditingLocale = useCallback((nextLocale: BlogLocale) => {
    setEditingLocale(nextLocale);
  }, []);

  const applyTranslatedLocale = useCallback(
    (
      targetLocale: BlogLocale,
      draft: Pick<BlogEditorTranslationDraft, "title" | "excerpt" | "bodyHtml">,
    ) => {
      setTranslationsMap((prev) => ({
        ...prev,
        [targetLocale]: {
          ...prev[targetLocale],
          ...draft,
        },
      }));
      setEditingLocale(targetLocale);
    },
    [],
  );

  const savableTranslations = useMemo(
    () => buildSavableBlogTranslations(translationsMap),
    [translationsMap],
  );

  const localeHasContent = useMemo(
    () =>
      BLOG_LOCALES.reduce(
        (acc, locale) => {
          acc[locale] = isBlogTranslationSavable(translationsMap[locale]);
          return acc;
        },
        {} as Record<BlogLocale, boolean>,
      ),
    [translationsMap],
  );

  return {
    editingLocale,
    switchEditingLocale,
    title: currentDraft.title,
    setTitle,
    excerpt: currentDraft.excerpt,
    setExcerpt,
    bodyHtml: currentDraft.bodyHtml,
    setBodyHtml,
    materials: currentDraft.materials,
    setMaterials,
    syncMediaToAllLocales,
    appendMaterialToAllLocales,
    applyTranslatedLocale,
    savableTranslations,
    localeHasContent,
  };
}
