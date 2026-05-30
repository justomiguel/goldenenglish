"use client";

import Link from "next/link";
import { Archive, ChartNoAxesColumn, Eye, Plus, Send, Star } from "lucide-react";
import {
  archiveBlogArticleAdminAction,
  pinBlogArticleAdminAction,
  publishBlogArticleAdminAction,
  submitBlogForReviewAdminAction,
} from "@/app/[locale]/dashboard/admin/cms/blog/actions";
import type { BlogArticleListItem } from "@/lib/blog/server";

interface BlogAdminListShellProps {
  locale: string;
  rows: BlogArticleListItem[];
  labels: {
    title: string;
    create: string;
    empty: string;
    publish: string;
    archive: string;
    submitForReview: string;
    pin: string;
    unpin: string;
    edit: string;
    views: string;
  };
}

export function BlogAdminListShell({ locale, rows, labels }: BlogAdminListShellProps) {
  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[var(--color-secondary)]">{labels.title}</h1>
        <Link
          href={`/${locale}/dashboard/admin/cms/blog/new`}
          className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-[var(--color-primary-foreground)]"
        >
          <Plus aria-hidden className="h-4 w-4" />
          {labels.create}
        </Link>
      </header>

      {rows.length === 0 ? (
        <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-muted-foreground)]">
          {labels.empty}
        </p>
      ) : null}

      <div className="grid gap-3">
        {rows.map((row) => (
          <article
            key={row.id}
            className="grid gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--color-foreground)]">
                  {row.translation?.title ?? row.id}
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)]">{row.status}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
                  <ChartNoAxesColumn aria-hidden className="h-3.5 w-3.5" />
                  {labels.views}: {row.viewCount.toLocaleString(locale)}
                </p>
              </div>
              <Link
                href={`/${locale}/dashboard/admin/cms/blog/${row.id}/edit`}
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:underline"
              >
                <Eye aria-hidden className="h-4 w-4" />
                {labels.edit}
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs font-medium"
                onClick={() => void publishBlogArticleAdminAction(locale, row.id)}
              >
                <Send aria-hidden className="h-3.5 w-3.5" />
                {labels.publish}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs font-medium"
                onClick={() => void submitBlogForReviewAdminAction(locale, row.id)}
              >
                <Send aria-hidden className="h-3.5 w-3.5" />
                {labels.submitForReview}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs font-medium"
                onClick={() => void archiveBlogArticleAdminAction(locale, row.id)}
              >
                <Archive aria-hidden className="h-3.5 w-3.5" />
                {labels.archive}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs font-medium"
                onClick={() => void pinBlogArticleAdminAction(locale, row.id, !row.isPinned)}
              >
                <Star aria-hidden className="h-3.5 w-3.5" />
                {row.isPinned ? labels.unpin : labels.pin}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
