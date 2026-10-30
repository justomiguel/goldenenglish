import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn();

vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
}));

import { createGuestComment } from "@/lib/blog/server/createGuestComment";

function admin() {
  return {
    from(table: string) {
      return {
        insert(row: unknown) {
          return {
            select() {
              return {
                single: () => insert(table, row),
              };
            },
            then(resolve: (value: unknown) => void) {
              resolve(insert(table, row));
            },
          };
        },
      };
    },
  };
}

const base = {
  articleId: "11111111-1111-4111-8111-111111111111",
  bodyText: "Hola",
  displayName: "Ada",
  email: "ada@example.com",
  commentsGloballyEnabled: true,
  guestCommentsEnabled: true,
  articleCommentsEnabled: true,
  visibility: "public" as const,
};

describe("createGuestComment", () => {
  beforeEach(() => {
    insert.mockReset();
    insert.mockImplementation((table: string) => {
      if (table === "blog_article_comments") {
        return Promise.resolve({ data: { id: "comment-1" }, error: null });
      }
      return Promise.resolve({ error: null });
    });
  });

  it("stores a pending comment and the email, and returns no email", async () => {
    const result = await createGuestComment(admin() as never, base);
    expect(result).toEqual({ ok: true });
    expect(result).not.toHaveProperty("email");
    expect(insert).toHaveBeenCalledWith(
      "blog_article_comments",
      expect.objectContaining({
        status: "pending",
        author_id: null,
        guest_display_name: "Ada",
      }),
    );
    expect(insert).toHaveBeenCalledWith(
      "blog_comment_guest_emails",
      expect.objectContaining({ comment_id: "comment-1", email: "ada@example.com" }),
    );
  });

  it("does not insert on a members article", async () => {
    const result = await createGuestComment(admin() as never, {
      ...base,
      visibility: "members",
    });
    expect(result).toEqual({ ok: false, code: "denied" });
    expect(insert).not.toHaveBeenCalled();
  });
});
