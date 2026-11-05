// REGRESSION CHECK: A public view must call increment_blog_article_view_count.
// A direct update on blog_articles fails for anon after migration 187.
import { beforeEach, describe, expect, it, vi } from "vitest";

const adminFrom = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: async () => ({ from: adminFrom }),
}));

import { incrementArticleViewCount } from "@/lib/blog/server/incrementArticleViewCount";

function eventsTable() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.gte = vi.fn(() => chain);
  chain.contains = vi.fn(() => chain);
  chain.limit = vi.fn(async () => ({ data: [], error: null }));
  chain.insert = vi.fn(async () => ({ error: null }));
  return chain;
}

describe("incrementArticleViewCount", () => {
  beforeEach(() => {
    adminFrom.mockReset();
    adminFrom.mockReturnValue(eventsTable());
  });

  it("increments through the rpc and does not update the table", async () => {
    const rpc = vi.fn(async () => ({ error: null }));
    const from = vi.fn();

    const result = await incrementArticleViewCount({ rpc, from } as never, {
      articleId: "5f466731-b5a4-4a7c-ac96-f1c77543bf59",
      entity: "section:blog",
      sessionKey: "es:slug",
    });

    expect(result).toEqual({ ok: true, deduped: false });
    expect(rpc).toHaveBeenCalledWith("increment_blog_article_view_count", {
      p_article_id: "5f466731-b5a4-4a7c-ac96-f1c77543bf59",
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("logs the rpc error and does not fall back to a table update", async () => {
    const rpc = vi.fn(async () => ({
      error: { message: "blog_update_forbidden", code: "P0001" },
    }));
    const from = vi.fn();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await incrementArticleViewCount({ rpc, from } as never, {
      articleId: "5f466731-b5a4-4a7c-ac96-f1c77543bf59",
      entity: "section:blog",
      sessionKey: "es:slug",
    });

    expect(result).toEqual({ ok: false, deduped: false });
    expect(from).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      "[ge:server]",
      "blog.increment_view.rpc",
      expect.objectContaining({
        articleId: "5f466731-b5a4-4a7c-ac96-f1c77543bf59",
      }),
    );
    errorSpy.mockRestore();
  });
});
