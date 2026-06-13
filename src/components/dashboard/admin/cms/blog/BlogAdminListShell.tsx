"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Archive,
  ChartNoAxesColumn,
  Copy,
  Eye,
  Plus,
  Send,
  Star,
  Trash2,
} from "lucide-react";
import {
  archiveBlogArticleAdminAction,
  deleteBlogArticleAdminAction,
  pinBlogArticleAdminAction,
  publishBlogArticleAdminAction,
  submitBlogForReviewAdminAction,
} from "@/app/[locale]/dashboard/admin/cms/blog/actions";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import { clientAbsoluteUrl } from "@/lib/client/publicUrl";
import type { BlogArticleListItem } from "@/lib/blog/server";

interface BlogAdminListShellProps {
  locale: string;
  rows: BlogArticleListItem[];
  canDelete: boolean;
  labels: {
    title: string;
    create: string;
    empty: string;
    publish: string;
    archive: string;
    delete: string;
    deleteConfirmTitle: string;
    deleteConfirmBody: string;
    deleteCancel: string;
    deleteConfirm: string;
    deleteError: string;
    copyLink: string;
    copyLinkCopied: string;
    submitForReview: string;
    pin: string;
    unpin: string;
    edit: string;
    views: string;
  };
}

export function BlogAdminListShell({
  locale,
  rows,
  canDelete,
  labels,
}: BlogAdminListShellProps) {
  const router = useRouter();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function runAction(action: () => Promise<{ ok: boolean }>) {
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (!result.ok) return;
    router.refresh();
  }

  async function onCopyPublishedLink(row: BlogArticleListItem) {
    const slug = row.translation?.slug?.trim();
    if (!slug) return;
    const pathname = `/${locale}/blog/${slug}`;
    const url = clientAbsoluteUrl(pathname);
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(url);
    setCopiedId(row.id);
    window.setTimeout(() => setCopiedId(null), 2200);
  }

  async function onConfirmDelete() {
    if (!deleteTargetId) return;
    setBusy(true);
    setErrorMsg(null);
    const result = await deleteBlogArticleAdminAction(locale, deleteTargetId);
    setBusy(false);
    if (!result.ok) {
      setErrorMsg(labels.deleteError);
      return;
    }
    setDeleteTargetId(null);
    router.refresh();
  }

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

      {errorMsg ? <p className="text-sm text-[var(--color-error)]">{errorMsg}</p> : null}

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
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs font-medium disabled:opacity-70"
                onClick={() =>
                  void runAction(() => publishBlogArticleAdminAction(locale, row.id))
                }
              >
                <Send aria-hidden className="h-3.5 w-3.5" />
                {labels.publish}
              </button>
              <button
                type="button"
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs font-medium disabled:opacity-70"
                onClick={() =>
                  void runAction(() => submitBlogForReviewAdminAction(locale, row.id))
                }
              >
                <Send aria-hidden className="h-3.5 w-3.5" />
                {labels.submitForReview}
              </button>
              {row.status === "published" && row.translation?.slug ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs font-medium"
                  onClick={() => void onCopyPublishedLink(row)}
                >
                  <Copy aria-hidden className="h-3.5 w-3.5" />
                  {copiedId === row.id ? labels.copyLinkCopied : labels.copyLink}
                </button>
              ) : null}
              <button
                type="button"
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs font-medium disabled:opacity-70"
                onClick={() => void runAction(() => archiveBlogArticleAdminAction(locale, row.id))}
              >
                <Archive aria-hidden className="h-3.5 w-3.5" />
                {labels.archive}
              </button>
              {canDelete ? (
                <button
                  type="button"
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-md border border-[var(--color-error)] px-2 py-1 text-xs font-medium text-[var(--color-error)] disabled:opacity-70"
                  onClick={() => setDeleteTargetId(row.id)}
                >
                  <Trash2 aria-hidden className="h-3.5 w-3.5" />
                  {labels.delete}
                </button>
              ) : null}
              <button
                type="button"
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs font-medium disabled:opacity-70"
                onClick={() =>
                  void runAction(() => pinBlogArticleAdminAction(locale, row.id, !row.isPinned))
                }
              >
                <Star aria-hidden className="h-3.5 w-3.5" />
                {row.isPinned ? labels.unpin : labels.pin}
              </button>
            </div>
          </article>
        ))}
      </div>

      <ConfirmActionModal
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
        title={labels.deleteConfirmTitle}
        body={labels.deleteConfirmBody}
        cancelLabel={labels.deleteCancel}
        confirmLabel={labels.deleteConfirm}
        confirmVariant="destructive"
        busy={busy}
        disableClose={busy}
        onConfirm={() => void onConfirmDelete()}
      />
    </section>
  );
}
