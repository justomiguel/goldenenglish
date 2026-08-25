"use client";

import { Eye, EyeOff, Flag } from "lucide-react";
import { moderateBlogCommentAdminAction } from "@/app/[locale]/dashboard/admin/cms/blog/actions";
import type { BlogArticleComment } from "@/lib/blog/domain";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";

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
      <AdminPageHeader title={labels.title} iconId="blog" />
      {comments.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.empty}</p>
      ) : null}
      {comments.map((comment) => (
        <article
          key={comment.id}
          className="space-y-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 shadow-[var(--shadow-soft)]"
        >
          <p className="text-sm text-[var(--color-foreground)]">{comment.bodyText}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-2 py-1 text-xs font-semibold"
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
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-2 py-1 text-xs font-semibold"
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
