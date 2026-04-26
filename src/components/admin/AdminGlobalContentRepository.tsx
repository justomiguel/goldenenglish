"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminGlobalContentRepositoryList } from "@/components/admin/AdminGlobalContentRepositoryList";
import type { ContentTemplateLibraryRow } from "@/lib/learning-tasks/loadContentTemplateLibrary";
import type { Dictionary } from "@/types/i18n";
import type { GlobalContentRepositoryPagination } from "@/types/globalContentRepository";

export type { GlobalContentRepositoryPagination };

interface AdminGlobalContentRepositoryProps {
  locale: string;
  contents: ContentTemplateLibraryRow[];
  pagination: GlobalContentRepositoryPagination;
  labels: Dictionary["dashboard"]["adminContents"];
}

export { buildAcademicContentsListPath } from "@/lib/admin/buildAcademicContentsListPath";

export function AdminGlobalContentRepository({
  locale,
  contents,
  pagination,
  labels,
}: AdminGlobalContentRepositoryProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{labels.repositoryTitle}</h2>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.repositoryStudioLead}</p>
        </div>
        <Link
          href={`/${locale}/dashboard/admin/academic/contents/global/new`}
          className="inline-flex items-center justify-center gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 py-2 font-medium text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-dark)]"
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          {labels.globalNewPageCta}
        </Link>
      </div>
      <AdminGlobalContentRepositoryList
        key={pagination.searchQuery}
        contents={contents}
        labels={labels}
        locale={locale}
        pagination={pagination}
      />
    </div>
  );
}
