/** Subject: blog photos stay whole and centered, and emphasis tags stay visible. */
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  ),
}));

import { BlogArticleCard } from "@/components/molecules/BlogArticleCard";
import { BlogArticleDetailHero } from "@/components/molecules/BlogArticleDetailHero";
import { BLOG_ARTICLE_BODY_PROSE } from "@/components/organisms/BlogArticleBodyHtml";
import type { BlogArticleListItem } from "@/lib/blog/server/types";

const COVER = "/images/liora/galeria/12.jpg";

const heroLabels = {
  backToBlog: "Volver",
  articleEyebrow: "Nota",
  publishedDateAria: "Fecha",
};

function article(): BlogArticleListItem {
  return {
    id: "article-1",
    defaultLocale: "es",
    status: "published",
    publishedAt: "2026-11-14T19:00:00.000Z",
    scheduledFor: null,
    coverStoragePath: null,
    tags: [],
    isPinned: false,
    pinnedAt: null,
    commentsEnabled: false,
    visibility: "public",
    authorId: "author-1",
    viewCount: 1,
    createdAt: "2026-11-14T19:00:00.000Z",
    updatedAt: "2026-11-14T19:00:00.000Z",
    updatedBy: null,
    translation: {
      articleId: "article-1",
      locale: "es",
      slug: "edad",
      title: "Edad",
      excerpt: "Respuesta",
      bodyHtml: `<p><img src="${COVER}" alt="Niña"></p>`,
      bodyTextPlain: "Respuesta",
      readingTimeMinutes: 2,
      attachments: [],
      seoTitle: null,
      seoDescription: null,
      ctaLabel: null,
      ctaUrl: null,
    },
  };
}

describe("blog article photo frame", () => {
  it("keeps the hero photo whole and centered", () => {
    const { container } = render(
      <BlogArticleDetailHero
        locale="es"
        title="Edad"
        coverImageUrl={COVER}
        coverUnoptimized
        displayDate="14 nov 2026"
        displayDateIso="2026-11-14"
        viewsLabel="2 vistas"
        labels={heroLabels}
      />,
    );
    const img = container.querySelector("img");
    expect(img?.className).toContain("object-contain");
    expect(img?.className).toContain("object-center");
    expect(img?.className).not.toContain("object-cover");
    expect(img?.parentElement?.className).toContain("justify-center");
  });

  it("keeps the card photo whole and centered", () => {
    const { container } = render(
      <BlogArticleCard
        locale="es"
        article={article()}
        labels={{ readMore: "Leer", publishedDateAria: "Fecha", viewsCount: "{count} vistas" }}
      />,
    );
    const img = container.querySelector("img");
    expect(img?.className).toContain("object-contain");
    expect(img?.className).toContain("object-center");
    expect(img?.className).not.toContain("object-cover");
  });

  it("centers a body image and keeps bold and underline", () => {
    expect(BLOG_ARTICLE_BODY_PROSE).toContain("[&_p:has(img)]:indent-0");
    expect(BLOG_ARTICLE_BODY_PROSE).toContain("[&_p:has(img)]:text-center");
    expect(BLOG_ARTICLE_BODY_PROSE).toContain("[&_img]:mx-auto");
    expect(BLOG_ARTICLE_BODY_PROSE).toContain("[&_img]:object-contain");
    expect(BLOG_ARTICLE_BODY_PROSE).toContain("[&_strong]:font-semibold");
    expect(BLOG_ARTICLE_BODY_PROSE).toContain("[&_u]:underline");
  });
});
