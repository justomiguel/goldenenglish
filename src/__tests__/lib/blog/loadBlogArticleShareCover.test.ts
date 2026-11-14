/** Subject: loadBlogArticleShareCover returns an absolute photo URL for the share preview. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { loadArticleBySlug } = vi.hoisted(() => ({
  loadArticleBySlug: vi.fn(),
}));

vi.mock("@/lib/blog/server/loadArticleBySlug", () => ({
  loadArticleBySlug,
}));

vi.mock("@/lib/supabase/requestPublicEnv", () => ({
  readRequestSupabasePublicEnv: vi.fn(async () => ({
    url: "https://project.supabase.co",
    anonKey: "anon",
  })),
}));

import { loadBlogArticleShareCover } from "@/lib/blog/server/loadBlogArticleShareCover";

const ORIGIN = "https://www.liorastudio.cl";

function loadedArticle(bodyHtml: string) {
  return {
    article: { coverStoragePath: null },
    translation: {
      seoTitle: null,
      title: "Edad",
      bodyHtml,
    },
    localeSlugs: { es: "edad" },
  };
}

describe("loadBlogArticleShareCover", () => {
  const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = ORIGIN;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = previousAppUrl;
  });

  it("turns a site-relative article photo into an absolute URL", async () => {
    loadArticleBySlug.mockResolvedValue(
      loadedArticle('<p><img src="/images/liora/galeria/12.jpg" alt="Niña"></p>'),
    );

    const cover = await loadBlogArticleShareCover({} as never, "es", "edad");

    expect(cover?.coverImageUrl).toBe(`${ORIGIN}/images/liora/galeria/12.jpg`);
  });

  it("keeps an absolute article photo URL", async () => {
    loadArticleBySlug.mockResolvedValue(
      loadedArticle('<p><img src="https://cdn.example/photo.jpg" alt="Foto"></p>'),
    );

    const cover = await loadBlogArticleShareCover({} as never, "es", "edad");

    expect(cover?.coverImageUrl).toBe("https://cdn.example/photo.jpg");
  });
});
