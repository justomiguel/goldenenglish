"use client";

import { useId } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Library, Route } from "lucide-react";
import {
  AdminGlobalContentRepository,
  type GlobalContentRepositoryPagination,
} from "@/components/admin/AdminGlobalContentRepository";
import { AdminLearningRoutesGrid } from "@/components/admin/AdminLearningRoutesGrid";
import {
  UnderlineTabBar,
  underlinePanelId,
  underlineTabId,
  type UnderlineTabItem,
} from "@/components/molecules/UnderlineTabBar";
import type { ContentTemplateLibraryRow } from "@/lib/learning-tasks/loadContentTemplateLibrary";
import type { LearningRouteContentTemplateOption } from "@/types/learningContent";
import type { Dictionary } from "@/types/i18n";

export type AcademicContentsTab = "repository" | "routes";

interface AdminAcademicContentsScreenProps {
  locale: string;
  activeTab: AcademicContentsTab;
  routes: LearningRouteContentTemplateOption[];
  globalContents: ContentTemplateLibraryRow[];
  repositoryPagination: GlobalContentRepositoryPagination;
  labels: Dictionary["dashboard"]["adminContents"];
}

export function buildAcademicContentsHubPath(
  locale: string,
  searchParams: URLSearchParams,
  updates: { tab: AcademicContentsTab },
): string {
  const next = new URLSearchParams(searchParams.toString());
  if (updates.tab === "routes") next.set("tab", "routes");
  else next.delete("tab");
  const qs = next.toString();
  return `/${locale}/dashboard/admin/academic/contents${qs ? `?${qs}` : ""}`;
}

export function AdminAcademicContentsScreen({
  locale,
  activeTab,
  routes,
  globalContents,
  repositoryPagination,
  labels,
}: AdminAcademicContentsScreenProps) {
  const idPrefix = useId().replace(/:/g, "");
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = activeTab;

  const tabItems: UnderlineTabItem[] = [
    { id: "repository", label: labels.repositoryTitle, Icon: Library },
    { id: "routes", label: labels.learningRoutesTitle, Icon: Route },
  ];

  const onTabChange = (id: string) => {
    const next = id === "routes" ? "routes" : "repository";
    router.replace(buildAcademicContentsHubPath(locale, searchParams, { tab: next }));
  };

  return (
    <div className="space-y-6">
      <header className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">{labels.title}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>
      </header>

      <div className="overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        <UnderlineTabBar
          idPrefix={idPrefix}
          ariaLabel={labels.contentsTablistAria}
          items={tabItems}
          value={tab}
          onChange={onTabChange}
        />

        <div
          id={underlinePanelId(idPrefix, "repository")}
          role="tabpanel"
          aria-labelledby={underlineTabId(idPrefix, "repository")}
          hidden={tab !== "repository"}
          tabIndex={0}
          className="outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
        >
          <AdminGlobalContentRepository
            locale={locale}
            contents={globalContents}
            pagination={repositoryPagination}
            labels={labels}
          />
        </div>

        <div
          id={underlinePanelId(idPrefix, "routes")}
          role="tabpanel"
          aria-labelledby={underlineTabId(idPrefix, "routes")}
          hidden={tab !== "routes"}
          tabIndex={0}
          className="space-y-4 px-4 py-4 sm:px-5 sm:py-5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
        >
          <p className="text-sm text-[var(--color-muted-foreground)]">{labels.learningRoutesLead}</p>
          <AdminLearningRoutesGrid locale={locale} routes={routes} labels={labels} />
        </div>
      </div>
    </div>
  );
}
