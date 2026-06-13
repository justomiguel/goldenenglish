import { describe, expect, it, vi } from "vitest";
import { saveArticleAction } from "@/lib/blog/server/saveArticleAction";

vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: vi.fn().mockResolvedValue({ ok: true }),
}));

const ACTOR_ID = "8e2f77a4-7e40-4ce2-8097-af843ab72158";
const ARTICLE_ID = "d8d5ee5f-eb44-4f54-8a57-375d8ecf4faf";

const validPayload = {
  defaultLocale: "es" as const,
  status: "draft" as const,
  translations: [
    {
      locale: "es" as const,
      slug: "test-post",
      title: "Title",
      excerpt: "Excerpt",
      bodyHtml: "<p>Body</p>",
    },
  ],
};

function mockCreateSupabase(options?: {
  actorId?: string;
  sessionUserId?: string | null;
}) {
  const insert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { id: ARTICLE_ID }, error: null }),
    }),
  });
  const upsertTranslations = vi.fn().mockResolvedValue({ error: null });

  const from = vi.fn((table: string) => {
    if (table === "blog_articles") {
      return { insert };
    }
    if (table === "blog_article_translations") {
      return { upsert: upsertTranslations };
    }
    throw new Error(`unexpected table ${table}`);
  });

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: options?.sessionUserId ? { id: options.sessionUserId } : null,
        },
      }),
    },
    from,
  };

  return { supabase, insert, upsertTranslations };
}

function mockUpdateSupabase(existingAuthorId: string) {
  const update = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: ARTICLE_ID }, error: null }),
      }),
    }),
  });
  const upsertTranslations = vi.fn().mockResolvedValue({ error: null });

  const from = vi.fn((table: string) => {
    if (table === "blog_articles") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { author_id: existingAuthorId, status: "draft" },
              error: null,
            }),
          }),
        }),
        update,
      };
    }
    if (table === "blog_article_translations") {
      return { upsert: upsertTranslations };
    }
    throw new Error(`unexpected table ${table}`);
  });

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: ACTOR_ID } } }),
    },
    from,
  };

  return { supabase, update, insert: vi.fn() };
}

describe("saveArticleAction", () => {
  it("rejects invalid payload", async () => {
    const { supabase } = mockCreateSupabase();
    const result = await saveArticleAction(supabase as never, {
      actorId: ACTOR_ID,
      actorRole: "admin",
      payload: { invalid: true },
    });
    expect(result).toEqual({ ok: false, code: "invalid_input" });
  });

  it("returns unauthorized when actor id is missing", async () => {
    const { supabase } = mockCreateSupabase();
    const result = await saveArticleAction(supabase as never, {
      actorId: "",
      actorRole: "admin",
      payload: validPayload,
    });
    expect(result).toEqual({ ok: false, code: "unauthorized" });
  });

  it("inserts new articles with author_id on create", async () => {
    const { supabase, insert } = mockCreateSupabase();
    const result = await saveArticleAction(supabase as never, {
      actorId: ACTOR_ID,
      actorRole: "admin",
      payload: validPayload,
    });

    expect(result).toEqual({ ok: true, articleId: ARTICLE_ID, shareLinks: [] });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        author_id: ACTOR_ID,
        updated_by: ACTOR_ID,
        status: "draft",
      }),
    );
  });

  it("falls back to session user when actorId is blank", async () => {
    const sessionUserId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    const { supabase, insert } = mockCreateSupabase({ sessionUserId });

    const result = await saveArticleAction(supabase as never, {
      actorId: "   ",
      actorRole: "admin",
      payload: validPayload,
    });

    expect(result).toEqual({ ok: true, articleId: ARTICLE_ID, shareLinks: [] });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        author_id: sessionUserId,
        updated_by: sessionUserId,
      }),
    );
  });

  it("updates existing articles without overwriting author_id", async () => {
    const { supabase, update, insert } = mockUpdateSupabase(ACTOR_ID);

    const result = await saveArticleAction(supabase as never, {
      articleId: ARTICLE_ID,
      actorId: ACTOR_ID,
      actorRole: "admin",
      payload: validPayload,
    });

    expect(result).toEqual({ ok: true, articleId: ARTICLE_ID, shareLinks: [] });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        updated_by: ACTOR_ID,
        status: "draft",
      }),
    );
    expect(update).toHaveBeenCalledWith(
      expect.not.objectContaining({
        author_id: expect.anything(),
      }),
    );
    expect(insert).not.toHaveBeenCalled();
  });
});
