import type { BlogVisibility } from "@/lib/blog/articleVisibility";

export type CommentInsertKind = "account_visible" | "guest_pending" | "denied";

export function commentInsertKind(input: {
  commentsGloballyEnabled: boolean;
  guestCommentsEnabled: boolean;
  articleCommentsEnabled: boolean;
  visibility: BlogVisibility;
  isSignedIn: boolean;
}): CommentInsertKind {
  if (!input.commentsGloballyEnabled || !input.articleCommentsEnabled) {
    return "denied";
  }
  if (input.isSignedIn) return "account_visible";
  if (input.guestCommentsEnabled && input.visibility === "public") {
    return "guest_pending";
  }
  return "denied";
}
