import type { ThemeDocumentV1 } from "@/lib/theme-document/themeDocumentV1";

const PAGE_PATHS = [
  ["findClass", "/encuentra-tu-clase"],
  ["events", "/eventos"],
  ["blog", "/blog"],
] as const;

/** Extra sitemap paths from the published theme document. */
export function documentIndexedPaths(
  document: Pick<ThemeDocumentV1, "pages"> | null | undefined,
): string[] {
  if (!document) return [];
  return PAGE_PATHS.flatMap(([pageId, suffix]) => (document.pages[pageId] ? [suffix] : []));
}

/** Legacy hosts keep the class-finder page until their document stores it. */
export function withFindClassPage(document: ThemeDocumentV1): ThemeDocumentV1 {
  if (document.pages.findClass) return document;
  return {
    ...document,
    pages: {
      ...document.pages,
      findClass: {
        sections: [{ id: "guide", variantId: "page.find-class", major: 1, props: {} }],
      },
    },
  };
}
