"use client";

import { useState } from "react";
import { Flag, Send } from "lucide-react";
import { useBlogComments } from "@/hooks/useBlogComments";

interface BlogCommentsSectionProps {
  articleId: string;
  labels: {
    title: string;
    placeholder: string;
    send: string;
    report: string;
    rateLimited: string;
  };
}

export function BlogCommentsSection({ articleId, labels }: BlogCommentsSectionProps) {
  const { comments, createComment, reportComment } = useBlogComments(articleId);
  const [draft, setDraft] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSend() {
    setMsg(null);
    const ok = await createComment(draft);
    if (!ok) {
      setMsg(labels.rateLimited);
      return;
    }
    setDraft("");
  }

  return (
    <section className="border-t border-[var(--color-border)] pt-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-base font-semibold text-[var(--color-secondary)]">{labels.title}</h3>
        {comments.length > 0 ? (
          <span className="text-xs text-[var(--color-muted-foreground)]">({comments.length})</span>
        ) : null}
      </div>

      {comments.length > 0 ? (
        <ul className="mt-3 divide-y divide-[var(--color-border)]">
          {comments.map((comment) => (
            <li key={comment.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
              <p className="min-w-0 flex-1 text-sm leading-relaxed text-[var(--color-foreground)]">
                {comment.bodyText}
              </p>
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                onClick={() => void reportComment(comment.id)}
              >
                <Flag aria-hidden className="h-3.5 w-3.5" />
                {labels.report}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start">
        <textarea
          className="min-h-[2.75rem] flex-1 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          rows={2}
          value={draft}
          placeholder={labels.placeholder}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button
          type="button"
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)]"
          onClick={() => void onSend()}
        >
          <Send aria-hidden className="h-4 w-4" />
          {labels.send}
        </button>
      </div>
      {msg ? <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}
    </section>
  );
}
