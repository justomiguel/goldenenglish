"use client";

import { useId } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Library, Route } from "lucide-react";
import { AdminCoursesPanel } from "@/components/admin/AdminCoursesPanel";
import type { AdminCourseListPage } from "@/lib/courses/loadAdminCourses";
import {
  AdminGlobalContentRepository,
  type GlobalContentRepositoryPagination,
} from "@/components/admin/AdminGlobalContentRepository";
import { AdminLearningRoutesGrid } from "@/components/admin/AdminLearningRoutesGrid";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";
import {
  UnderlineTabBar,
  underlinePanelId,
  underlineTabId,
  type UnderlineTabItem,
} from "@/components/molecules/UnderlineTabBar";
import type { ContentTemplateLibraryRow } from "@/lib/learning-tasks/loadContentTemplateLibrary";
import type { LearningRouteContentTemplateOption } from "@/types/learningContent";
import type { Dictionary } from "@/types/i18n";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

export type AcademicContentsTab = "repository" | "routes" | "courses";

const EMPTY_COURSES: AdminCourseListPage = { rows: [], page: 1, pageSize: 20, totalCount: 0 };

interface AdminAcademicContentsScreenProps {
  locale: string;
  activeTab: AcademicContentsTab;
  routes: LearningRouteContentTemplateOption[];
  globalContents: ContentTemplateLibraryRow[];
  repositoryPagination: GlobalContentRepositoryPagination;
  courses?: AdminCourseListPage;
  sections?: { id: string; name: string }[];
  labels: Dictionary["dashboard"]["adminContents"];
}

export function buildAcademicContentsHubPath(
  locale: string,
  searchParams: URLSearchParams,
  updates: { tab: AcademicContentsTab },
): string {
  const next = new URLSearchParams(searchParams.toString());
  if (updates.tab === "repository") next.delete("tab");
  else next.set("tab", updates.tab);
  const qs = next.toString();
  return `/${locale}/dashboard/admin/academic/contents${qs ? `?${qs}` : ""}`;
}

export function AdminAcademicContentsScreen({
  locale,
  activeTab,
  routes,
  globalContents,
  repositoryPagination,
  courses = EMPTY_COURSES,
  sections = [],
  labels,
}: AdminAcademicContentsScreenProps) {
  const idPrefix = useId().replace(/:/g, "");
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = activeTab;

  const tabItems: UnderlineTabItem[] = [
    {
      id: "repository",
      label: labels.repositoryTitle,
      Icon: Library,
      tourId: ADMIN_TOUR_ANCHORS.contentsTabRepository,
    },
    {
      id: "routes",
      label: labels.learningRoutesTitle,
      Icon: Route,
      tourId: ADMIN_TOUR_ANCHORS.contentsTabRoutes,
    },
    {
      id: "courses",
      label: labels.coursesTab,
      Icon: GraduationCap,
    },
  ];

  const onTabChange = (id: string) => {
    const next = id === "routes" || id === "courses" ? id : "repository";
    router.replace(buildAcademicContentsHubPath(locale, searchParams, { tab: next }));
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={labels.title}
        lead={labels.lead}
        iconId="contents"
        tourAnchor={ADMIN_TOUR_ANCHORS.contentsTitle}
      />

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-[var(--shadow-soft)]">
        <div data-tour={ADMIN_TOUR_ANCHORS.contentsTabs}>
          <UnderlineTabBar
            idPrefix={idPrefix}
            ariaLabel={labels.contentsTablistAria}
            items={tabItems}
            value={tab}
            onChange={onTabChange}
          />
        </div>

        <div data-tour={ADMIN_TOUR_ANCHORS.contentsWorkspace}>
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

          <div
            id={underlinePanelId(idPrefix, "courses")}
            role="tabpanel"
            aria-labelledby={underlineTabId(idPrefix, "courses")}
            hidden={tab !== "courses"}
            tabIndex={0}
            className="outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          >
            <AdminCoursesPanel
              locale={locale}
              list={courses}
              templates={globalContents.map((row) => ({ id: row.id, title: row.title }))}
              sections={sections}
              labels={labels}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
