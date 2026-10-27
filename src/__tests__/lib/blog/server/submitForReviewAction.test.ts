/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { notifyAdminsBlogPendingReview } = vi.hoisted(() => ({
  notifyAdminsBlogPendingReview: vi.fn(async () => undefined),
}));

vi.mock("@/lib/email/notifyAdminsBlogReview", () => ({
  notifyAdminsBlogPendingReview,
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
}));

import { submitForReviewAction } from "@/lib/blog/server/submitForReviewAction";

const ARTICLE_ID = "d8d5ee5f-eb44-4f54-8a57-375d8ecf4faf";

function supabase(error: { message: string } | null) {
  const eq = vi.fn(async () => ({ error }));
  return {
    from: vi.fn((table: string) => {
      if (table === "blog_articles") return { update: () => ({ eq }) };
      return { insert: vi.fn(async () => ({ error: null })) };
    }),
    eq,
  };
}

describe("submitForReviewAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mails admins after the article is pending review", async () => {
    const client = supabase(null);
    const result = await submitForReviewAction(client as never, {
      articleId: ARTICLE_ID,
      actorRole: "teacher",
      locale: "es",
    });
    expect(result).toEqual({ ok: true });
    expect(notifyAdminsBlogPendingReview).toHaveBeenCalledWith({
      supabase: client,
      articleId: ARTICLE_ID,
      locale: "es",
    });
  });

  it("does not mail admins when the status update fails", async () => {
    const result = await submitForReviewAction(supabase({ message: "no" }) as never, {
      articleId: ARTICLE_ID,
      actorRole: "teacher",
    });
    expect(result).toEqual({ ok: false, code: "update_failed" });
    expect(notifyAdminsBlogPendingReview).not.toHaveBeenCalled();
  });
});
