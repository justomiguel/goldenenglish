"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Archive, Eye, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { TablePagination } from "@/components/molecules/TablePagination";
import { archiveGlobalContentAction } from "@/app/[locale]/dashboard/admin/academic/contents/globalContentBuilderActions";
import {
  deleteGlobalContentAction,
  getGlobalContentDeleteImpactAction,
} from "@/app/[locale]/dashboard/admin/academic/contents/globalContentLifecycleActions";
import {
  AdminGlobalContentRepositoryActionModal,
  type RepositoryActionModalState,
} from "@/components/admin/AdminGlobalContentRepositoryActionModal";
import { ContentTemplateAttachmentSummary } from "@/components/admin/ContentTemplateAttachmentSummary";
import { buildAcademicContentsListPath } from "@/lib/admin/buildAcademicContentsListPath";
import type { ContentTemplateLibraryRow } from "@/lib/learning-tasks/loadContentTemplateLibrary";
import type { Dictionary } from "@/types/i18n";
import type { GlobalContentRepositoryPagination } from "@/types/globalContentRepository";

export function AdminGlobalContentRepositoryList({
  contents,
  labels,
  locale,
  pagination,
}: {
  contents: ContentTemplateLibraryRow[];
  labels: Dictionary["dashboard"]["adminContents"];
  locale: string;
  pagination: GlobalContentRepositoryPagination;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [draftQ, setDraftQ] = useState(pagination.searchQuery);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<RepositoryActionModalState>(null);
  const [isPending, startTransition] = useTransition();

  const go = (updates: { page?: number; q?: string }) => {
    router.push(buildAcademicContentsListPath(locale, searchParams, updates));
  };

  const openArchive = (item: ContentTemplateLibraryRow) => {
    setActionError(null);
    setActionModal({ kind: "archive", id: item.id, title: item.title });
  };

  const openDelete = (item: ContentTemplateLibraryRow) => {
    setActionError(null);
    startTransition(() => {
      void (async () => {
        const impact = await getGlobalContentDeleteImpactAction({ locale, id: item.id });
        if (impact.ok) {
          setActionModal({
            kind: "delete",
            id: item.id,
            title: item.title,
            routeStepCount: impact.routeStepCount,
          });
        } else {
          setActionError(labels.repositoryActionFailed);
        }
      })();
    });
  };

  const confirmAction = () => {
    if (!actionModal) return;
    setActionError(null);
    startTransition(() => {
      void (async () => {
        const r =
          actionModal.kind === "archive"
            ? await archiveGlobalContentAction({ locale, id: actionModal.id })
            : await deleteGlobalContentAction({ locale, id: actionModal.id });
        if (r.ok) {
          setActionModal(null);
          router.refresh();
        } else setActionError(labels.repositoryActionFailed);
      })();
    });
  };

  const emptyNoSearch = contents.length === 0 && !pagination.searchQuery.trim();
  const emptySearch = contents.length === 0 && pagination.searchQuery.trim().length > 0;

  return (
    <aside className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{labels.repositoryTitle}</h2>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{labels.repositoryStudioLead}</p>
      </div>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          go({ page: 1, q: draftQ });
        }}
      >
        <div className="min-w-[12rem] flex-1">
          <label htmlFor="global-repo-search" className="sr-only">
            {labels.repositorySearchPlaceholder}
          </label>
          <Input
            id="global-repo-search"
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            placeholder={labels.repositorySearchPlaceholder}
            autoComplete="off"
          />
        </div>
        <Button type="submit" variant="secondary" size="sm" disabled={isPending}>
          <Search className="h-4 w-4 shrink-0" aria-hidden />
          {labels.repositorySearchSubmit}
        </Button>
      </form>
      {emptyNoSearch ? <p className="text-sm text-[var(--color-muted-foreground)]">{labels.repositoryEmpty}</p> : null}
      {emptySearch ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.repositorySearchNoResults}</p>
      ) : null}
      {actionError ? (
        <p
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-error)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-error)]"
          role="alert"
        >
          {actionError}
        </p>
      ) : null}
      {contents.length > 0 ? (
        <>
          <ul className="space-y-2">
            {contents.map((item) => (
              <li key={item.id}>
                <article className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-3 transition">
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                    <div className="min-w-0 flex-1">
                      <span className="block font-semibold text-[var(--color-foreground)]">{item.title}</span>
                      <span className="mt-1 line-clamp-2 block text-xs text-[var(--color-muted-foreground)]">
                        {item.description || labels.noDescription}
                      </span>
                    </div>
                    <ContentTemplateAttachmentSummary
                      assets={item.assets}
                      labels={labels}
                      listClassName="mt-0 flex w-full shrink-0 flex-wrap justify-end gap-1.5 sm:w-auto sm:max-w-[min(50%,14rem)]"
                    />
                  </div>
                  <span className="mt-2 block text-xs text-[var(--color-muted-foreground)]">
                    {new Date(item.updatedAt).toLocaleString(locale)} ·{" "}
                    {labels.assetCount.replace("{count}", String(item.assetCount))} ·{" "}
                    {labels.blockCount.replace("{count}", String(item.blockCount))}
                  </span>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/${locale}/dashboard/admin/academic/contents/global/${item.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-secondary)] px-3 py-1.5 text-sm font-medium text-[var(--color-secondary-foreground)] transition-colors hover:bg-[var(--color-secondary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2"
                    >
                      <Eye className="h-4 w-4 shrink-0" aria-hidden />
                      {labels.view}
                    </Link>
                    <Button type="button" variant="secondary" size="sm" disabled={isPending} onClick={() => openArchive(item)}>
                      <Archive className="h-4 w-4 shrink-0" aria-hidden />
                      {labels.archive}
                    </Button>
                    <Button type="button" variant="secondary" size="sm" disabled={isPending} onClick={() => openDelete(item)}>
                      <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                      {labels.delete}
                    </Button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
          {pagination.totalCount > 0 ? (
            <TablePagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              totalCount={pagination.totalCount}
              onPageChange={(nextPage) => go({ page: nextPage, q: pagination.searchQuery })}
              labels={{
                prev: labels.repositoryPaginationPrev,
                next: labels.repositoryPaginationNext,
                summary: labels.repositoryPaginationSummary,
                tipPrev: labels.repositoryPaginationTipPrev,
                tipNext: labels.repositoryPaginationTipNext,
              }}
            />
          ) : null}
        </>
      ) : null}
      <AdminGlobalContentRepositoryActionModal
        action={actionModal}
        labels={labels}
        busy={isPending}
        onOpenChange={(open) => {
          if (!open) setActionModal(null);
        }}
        onConfirm={confirmAction}
      />
    </aside>
  );
}
