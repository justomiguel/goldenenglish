import { describe, expect, it, vi } from "vitest";
import { createCommentAction } from "@/lib/blog/server/commentActions";

describe("createCommentAction", () => {
  it("rejects invalid payload", async () => {
    const supabase = {} as never;
    const result = await createCommentAction(supabase, {
      actorId: "u-1",
      payload: { nope: true },
    });
    expect(result).toEqual({ ok: false, code: "invalid_input" });
  });

  it("inserts sanitized comment", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ insert });
    const supabase = { from } as unknown as Parameters<typeof createCommentAction>[0];

    const result = await createCommentAction(supabase, {
      actorId: "8e2f77a4-7e40-4ce2-8097-af843ab72158",
      payload: {
        articleId: "d8d5ee5f-eb44-4f54-8a57-375d8ecf4faf",
        bodyText: "<b>Hello</b> world",
      },
    });

    expect(result).toEqual({ ok: true });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        body_text: "Hello world",
      }),
    );
  });
});
