"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AppLocale } from "@/lib/i18n/dictionaries";

type LocaleHrefMap = Partial<Record<AppLocale, string>>;

const BlogArticleLocaleHrefContext = createContext<LocaleHrefMap | null>(null);

interface BlogArticleLocaleHrefProviderProps {
  hrefs: LocaleHrefMap;
  children: ReactNode;
}

export function BlogArticleLocaleHrefProvider({
  hrefs,
  children,
}: BlogArticleLocaleHrefProviderProps) {
  return (
    <BlogArticleLocaleHrefContext value={hrefs}>{children}</BlogArticleLocaleHrefContext>
  );
}

export function useBlogArticleLocaleHrefs(): LocaleHrefMap | null {
  return useContext(BlogArticleLocaleHrefContext);
}
