"use client";

import { useState } from "react";
import type { BlogLocale } from "@/lib/blog/domain";
import { translateBlogArticleAdminAction } from "@/app/[locale]/dashboard/admin/cms/blog/actions";

interface UseBlogTranslateInput {
  articleId: string;
  sourceLocale: BlogLocale;
}

export function useBlogTranslate({ articleId, sourceLocale }: UseBlogTranslateInput) {
  const [isTranslating, setIsTranslating] = useState(false);

  async function translate(
    targetLocale: BlogLocale,
    tipTapDoc: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> {
    setIsTranslating(true);
    const result = await translateBlogArticleAdminAction({
      articleId,
      sourceLocale,
      targetLocale,
      tipTapDoc,
    });
    setIsTranslating(false);
    if (!result.ok || !result.translatedDoc) return null;
    return result.translatedDoc;
  }

  return { isTranslating, translate };
}
