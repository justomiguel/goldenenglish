// REGRESSION CHECK: Public article lists stay public-only unless includeMembers is true.
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadPublishedArticles } from "@/lib/blog/server/loadPublishedArticles";

const ARTICLE = {
  id: "article-1",
  default_locale: "es",
  status: "published",
  published_at: "2026-01-15T12:00:00.000Z",
  scheduled_for: null,
  cover_storage_path: null,
  tags: ["news"],
  is_pinned: false,
  pinned_at: null,
  comments_enabled: true,
  visibility: "public",
  author_id: "author-1",
  view_count: 3,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-15T12:00:00.000Z",
  updated_by: null,
};

const TRANSLATION = {
  article_id: "article-1",
  locale: "es",
  slug: "nota",
  title: "Nota",
  excerpt: "Resumen",
  body_html: "<p>Hola</p>",
  body_text_plain: "Hola",
  reading_time_minutes: 1,
  seo_title: null,
  seo_description: null,
  attachments: [],
};

function createSupabase() {
  const eqCalls: Array<[string, unknown]> = [];
  const articleQuery = {
    select: vi.fn(() => articleQuery),
    eq(column: string, value: unknown) {
      eqCalls.push([column, value]);
      return articleQuery;
    },
    not: vi.fn(() => articleQuery),
    lte: vi.fn(() => articleQuery),
    order: vi.fn(() => articleQuery),
    range: vi.fn(() => articleQuery),
    contains: vi.fn(() => articleQuery),
    in: vi.fn(() => articleQuery),
    then(onFulfilled: (value: unknown) => unknown) {
      return Promise.resolve({ data: [ARTICLE], error: null, count: 1 }).then(onFulfilled);
    },
  };

  const translationQuery = {
    select: vi.fn(() => translationQuery),
    eq: vi.fn(() => translationQuery),
    in: vi.fn().mockResolvedValue({ data: [TRANSLATION], error: null }),
    textSearch: vi.fn().mockResolvedValue({ data: [], error: null }),
  };

  const supabase = {
    from: vi.fn((table: string) =>
      table === "blog_article_translations" ? translationQuery : articleQuery,
    ),
  } as unknown as SupabaseClient;

  return { supabase, eqCalls };
}

const input = { locale: "es" as const, page: 1, pageSize: 12 };

describe("loadPublishedArticles visibility", () => {
  it("filters public articles when includeMembers is omitted", async () => {
    const { supabase, eqCalls } = createSupabase();
    const result = await loadPublishedArticles(supabase, input);

    expect(eqCalls).toContainEqual(["visibility", "public"]);
    expect(result.rows[0]?.visibility).toBe("public");
  });

  it("omits the public filter when includeMembers is true", async () => {
    const { supabase, eqCalls } = createSupabase();
    const result = await loadPublishedArticles(supabase, { ...input, includeMembers: true });

    expect(eqCalls.some(([column]) => column === "visibility")).toBe(false);
    expect(result.rows[0]?.visibility).toBe("public");
  });
});
