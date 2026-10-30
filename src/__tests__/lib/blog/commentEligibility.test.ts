// REGRESSION CHECK: Blog visibility, guest comments, and 30-day rates must stay aligned with the 2026-10-28 spec.
import { describe, expect, it } from "vitest";
import type { BlogVisibility } from "@/lib/blog/articleVisibility";
import { commentInsertKind, type CommentInsertKind } from "@/lib/blog/commentEligibility";
import { BLOG_COMMENT_STATUSES } from "@/lib/blog/domain";

type MatrixRow = {
  global: boolean;
  guest: boolean;
  article: boolean;
  visibility: BlogVisibility;
  signedIn: boolean;
  result: CommentInsertKind;
};

const MATRIX: MatrixRow[] = [
  { global: false, guest: true, article: true, visibility: "public", signedIn: false, result: "denied" },
  { global: true, guest: false, article: true, visibility: "public", signedIn: false, result: "denied" },
  { global: true, guest: true, article: false, visibility: "public", signedIn: false, result: "denied" },
  { global: true, guest: true, article: true, visibility: "members", signedIn: false, result: "denied" },
  { global: true, guest: true, article: true, visibility: "public", signedIn: false, result: "guest_pending" },
  { global: true, guest: false, article: true, visibility: "members", signedIn: true, result: "account_visible" },
  { global: true, guest: false, article: true, visibility: "public", signedIn: true, result: "account_visible" },
];

describe("commentInsertKind", () => {
  it("keeps pending in the comment status list", () => {
    expect(BLOG_COMMENT_STATUSES).toEqual(["visible", "hidden", "flagged", "pending"]);
  });

  it.each(MATRIX)(
    "global $global guest $guest article $article $visibility signedIn $signedIn → $result",
    ({ global, guest, article, visibility, signedIn, result }) => {
      expect(
        commentInsertKind({
          commentsGloballyEnabled: global,
          guestCommentsEnabled: guest,
          articleCommentsEnabled: article,
          visibility,
          isSignedIn: signedIn,
        }),
      ).toBe(result);
    },
  );

  it("denies a signed-in reader when global or article comments are off", () => {
    expect(
      commentInsertKind({
        commentsGloballyEnabled: false,
        guestCommentsEnabled: true,
        articleCommentsEnabled: true,
        visibility: "public",
        isSignedIn: true,
      }),
    ).toBe("denied");
    expect(
      commentInsertKind({
        commentsGloballyEnabled: true,
        guestCommentsEnabled: true,
        articleCommentsEnabled: false,
        visibility: "members",
        isSignedIn: true,
      }),
    ).toBe("denied");
  });
});
