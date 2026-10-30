import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();

vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
}));

import { loadBlogAdminStats } from "@/lib/blog/server/loadBlogAdminStats";

function supabase() {
  return {
    rpc,
    from() {
      return {
        select() {
          return {
            in: async () => ({ data: [] }),
          };
        },
      };
    },
  };
}

describe("loadBlogAdminStats", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("returns a null list-to-article rate when list views are 0", async () => {
    rpc.mockResolvedValue({
      data: [
        {
          articleViews: 4,
          indexArticleViews: 1,
          listViews: 0,
          articles: [],
        },
      ],
      error: null,
    });
    const result = await loadBlogAdminStats(supabase() as never, "es");
    expect(result.listToArticle).toBeNull();
    expect(result.reading).toBe(4);
  });
});
