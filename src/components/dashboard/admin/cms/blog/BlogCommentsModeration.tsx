"use client";

import { Eye, EyeOff, Flag } from "lucide-react";
import { moderateBlogCommentAdminAction } from "@/app/[locale]/dashboard/admin/cms/blog/actions";
import type { BlogArticleComment } from "@/lib/blog/domain";

interface BlogCommentsModerationProps {
  comments: BlogArticleComment[];
  labels: {
    title: string;
    empty: string;
    hide: string;
    show: string;
    flag: string;
  };
}

export function BlogCommentsModeration({ comments, labels }: BlogCommentsModerationProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-[var(--color-secondary)]">{labels.title}</h2>
      {comments.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.empty}</p>
      ) : null}
      {comments.map((comment) => (
        <article
          key={comment.id}
          className="space-y-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
        >
          <p className="text-sm text-[var(--color-foreground)]">{comment.bodyText}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs font-semibold"
              onClick={() =>
                void moderateBlogCommentAdminAction(
                  comment.id,
                  comment.status === "hidden" ? "visible" : "hidden",
                )
              }
            >
              {comment.status === "hidden" ? (
                <Eye aria-hidden className="h-3.5 w-3.5" />
              ) : (
                <EyeOff aria-hidden className="h-3.5 w-3.5" />
              )}
              {comment.status === "hidden" ? labels.show : labels.hide}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs font-semibold"
              onClick={() => void moderateBlogCommentAdminAction(comment.id, "flagged")}
            >
              <Flag aria-hidden className="h-3.5 w-3.5" />
              {labels.flag}
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
