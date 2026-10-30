// REGRESSION CHECK: Anonymous members slugs redirect to login before any title is read.
// REGRESSION CHECK: The admin article select must stay free of title and body_html.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { membersSlugRedirectForAnonymous } from "@/lib/blog/server/loadMembersSlugGate";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError } from "@/lib/logging/serverActionLog";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseError: vi.fn(),
}));

const articleSelects: string[] = [];

type QueryResult = {
  data: Record<string, unknown> | null;
  error: { message: string; code: string } | null;
};

function installAdmin(input: { translation: QueryResult; article?: QueryResult }): void {
  articleSelects.length = 0;
  vi.mocked(createAdminClient).mockResolvedValue({
    from(table: string) {
      const api = {
        select(columns: string) {
          if (table === "blog_articles") articleSelects.push(columns);
          return api;
        },
        eq() {
          return api;
        },
        maybeSingle() {
          if (table === "blog_article_translations") return Promise.resolve(input.translation);
          if (table === "blog_articles") {
            return Promise.resolve(input.article ?? { data: null, error: null });
          }
          return Promise.resolve({
            data: null,
            error: { message: "unexpected table", code: "test" },
          });
        },
      };
      return api;
    },
  } as never);
}

const publishedAt = "2020-03-01T12:00:00.000Z";

describe("membersSlugRedirectForAnonymous", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    articleSelects.length = 0;
  });

  it("sends an anonymous members article to login with the canonical slug", async () => {
    installAdmin({
      translation: { data: { article_id: "article-1", slug: "marzo" }, error: null },
      article: {
        data: {
          id: "article-1",
          visibility: "members",
          status: "published",
          published_at: publishedAt,
        },
        error: null,
      },
    });

    const path = await membersSlugRedirectForAnonymous({
      locale: "es",
      slug: "marzo",
      isSignedIn: false,
    });

    expect(path).toBe("/es/login?next=%2Fes%2Fblog%2Fmarzo");
    expect(articleSelects.length).toBeGreaterThan(0);
    const articleSelect = articleSelects.join(" ");
    expect(articleSelect).not.toContain("title");
    expect(articleSelect).not.toContain("body_html");
  });

  it("returns null for a published public article", async () => {
    installAdmin({
      translation: { data: { article_id: "article-1", slug: "marzo" }, error: null },
      article: {
        data: {
          id: "article-1",
          visibility: "public",
          status: "published",
          published_at: publishedAt,
        },
        error: null,
      },
    });

    const path = await membersSlugRedirectForAnonymous({
      locale: "es",
      slug: "marzo",
      isSignedIn: false,
    });

    expect(path).toBeNull();
  });

  it("returns null for a signed-in caller and skips the admin client", async () => {
    const path = await membersSlugRedirectForAnonymous({
      locale: "es",
      slug: "marzo",
      isSignedIn: true,
    });

    expect(path).toBeNull();
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("returns null when the members article is not published yet", async () => {
    installAdmin({
      translation: { data: { article_id: "article-1", slug: "marzo" }, error: null },
      article: {
        data: {
          id: "article-1",
          visibility: "members",
          status: "published",
          published_at: "2999-01-01T00:00:00.000Z",
        },
        error: null,
      },
    });

    const path = await membersSlugRedirectForAnonymous({
      locale: "es",
      slug: "marzo",
      isSignedIn: false,
    });

    expect(path).toBeNull();
  });

  it("logs a supabase error without the slug and returns null", async () => {
    installAdmin({
      translation: {
        data: null,
        error: { message: "db down", code: "XX000" },
      },
    });

    const path = await membersSlugRedirectForAnonymous({
      locale: "es",
      slug: "marzo body text",
      isSignedIn: false,
    });

    expect(path).toBeNull();
    expect(logSupabaseError).toHaveBeenCalled();
    const logged = vi.mocked(logSupabaseError).mock.calls.map((call) => JSON.stringify(call));
    expect(logged.join("\n")).not.toContain("marzo body text");
  });
});
