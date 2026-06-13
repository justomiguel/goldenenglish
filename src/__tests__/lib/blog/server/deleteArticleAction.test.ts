import { describe, expect, it, vi } from "vitest";
import { deleteArticleAction } from "@/lib/blog/server/submitForReviewAction";

vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: vi.fn().mockResolvedValue({ ok: true }),
}));

const ARTICLE_ID = "d8d5ee5f-eb44-4f54-8a57-375d8ecf4faf";
const ACTOR_ID = "8e2f77a4-7e40-4ce2-8097-af843ab72158";

describe("deleteArticleAction", () => {
  it("forbids teachers", async () => {
    const supabase = { from: vi.fn() };
    const result = await deleteArticleAction(supabase as never, {
      articleId: ARTICLE_ID,
      actorRole: "teacher",
      actorId: ACTOR_ID,
    });
    expect(result).toEqual({ ok: false, code: "forbidden" });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("deletes article for admin", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const deleteFn = vi.fn().mockReturnValue({ eq });
    const insert = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "blog_articles") return { delete: deleteFn };
        if (table === "user_events") return { insert };
        throw new Error(`unexpected table ${table}`);
      }),
    };

    const result = await deleteArticleAction(supabase as never, {
      articleId: ARTICLE_ID,
      actorRole: "admin",
      actorId: ACTOR_ID,
    });

    expect(result).toEqual({ ok: true });
    expect(deleteFn).toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith("id", ARTICLE_ID);
  });
});
