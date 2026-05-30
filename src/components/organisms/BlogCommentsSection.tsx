"use client";

import { useState } from "react";
import Link from "next/link";
import { Flag, LogIn, Send } from "lucide-react";
import { useBlogComments } from "@/hooks/useBlogComments";

interface BlogCommentsSectionProps {
  articleId: string;
  canComment: boolean;
  signInHref: string;
  signInLabel: string;
  labels: {
    title: string;
    placeholder: string;
    send: string;
    signInRequired: string;
    report: string;
    rateLimited: string;
  };
}

export function BlogCommentsSection({
  articleId,
  canComment,
  signInHref,
  signInLabel,
  labels,
}: BlogCommentsSectionProps) {
  const { comments, createComment, reportComment } = useBlogComments(articleId);
  const [draft, setDraft] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSend() {
    setMsg(null);
    const ok = await createComment(draft);
    if (!ok) {
      setMsg(labels.signInRequired);
      return;
    }
    setDraft("");
  }

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold text-[var(--color-secondary)]">{labels.title}</h3>
      <div className="space-y-2">
        {comments.map((comment) => (
          <article
            key={comment.id}
            className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
          >
            <p className="text-sm text-[var(--color-foreground)]">{comment.bodyText}</p>
            {canComment ? (
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                onClick={() => void reportComment(comment.id)}
              >
                <Flag aria-hidden className="h-3.5 w-3.5" />
                {labels.report}
              </button>
            ) : null}
          </article>
        ))}
      </div>

      {canComment ? (
        <div className="grid gap-2">
          <textarea
            className="min-h-24 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            value={draft}
            placeholder={labels.placeholder}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-[var(--color-primary-foreground)]"
            onClick={() => void onSend()}
          >
            <Send aria-hidden className="h-4 w-4" />
            {labels.send}
          </button>
          {msg ? <p className="text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}
        </div>
      ) : (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {labels.signInRequired}{" "}
          <Link
            href={signInHref}
            className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
          >
            <LogIn aria-hidden className="h-3.5 w-3.5" />
            {signInLabel}
          </Link>
        </p>
      )}
    </section>
  );
}
