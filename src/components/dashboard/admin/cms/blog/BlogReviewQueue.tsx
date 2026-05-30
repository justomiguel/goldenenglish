"use client";

import { CheckCircle2 } from "lucide-react";
import { publishBlogArticleAdminAction } from "@/app/[locale]/dashboard/admin/cms/blog/actions";
import type { BlogArticleListItem } from "@/lib/blog/server";

interface BlogReviewQueueProps {
  locale: string;
  rows: BlogArticleListItem[];
  labels: {
    title: string;
    empty: string;
    approve: string;
  };
}

export function BlogReviewQueue({ locale, rows, labels }: BlogReviewQueueProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-[var(--color-secondary)]">{labels.title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.empty}</p>
      ) : null}
      {rows.map((row) => (
        <div
          key={row.id}
          className="flex items-center justify-between rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
        >
          <p className="text-sm font-medium">{row.translation?.title ?? row.id}</p>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs font-semibold"
            onClick={() => void publishBlogArticleAdminAction(locale, row.id)}
          >
            <CheckCircle2 aria-hidden className="h-3.5 w-3.5" />
            {labels.approve}
          </button>
        </div>
      ))}
    </section>
  );
}
