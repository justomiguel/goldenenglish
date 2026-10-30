import { ChevronLeft, ChevronRight } from "lucide-react";
import { AdminCourseAssignForm } from "@/components/admin/AdminCourseAssignForm";
import { AdminCourseGrantForm } from "@/components/admin/AdminCourseGrantForm";
import { AdminCourseCreateForm } from "@/components/admin/AdminCourseCreateForm";
import type { AdminCourseListPage } from "@/lib/courses/loadAdminCourses";
import type { Dictionary } from "@/types/i18n";

interface AdminCoursesPanelProps {
  locale: string;
  list: AdminCourseListPage;
  templates: { id: string; title: string }[];
  sections: { id: string; name: string }[];
  labels: Dictionary["dashboard"]["adminContents"];
}

function pageHref(locale: string, page: number): string {
  const params = new URLSearchParams({ tab: "courses", coursePage: String(page) });
  return `/${locale}/dashboard/admin/academic/contents?${params.toString()}`;
}

export function AdminCoursesPanel({ locale, list, templates, sections, labels }: AdminCoursesPanelProps) {
  const pageCount = Math.max(1, Math.ceil(list.totalCount / list.pageSize));
  return (
    <div className="space-y-6 px-4 py-4 sm:px-5 sm:py-5">
      <p className="text-sm text-[var(--color-muted-foreground)]">{labels.coursesLead}</p>
      {list.rows.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.coursesEmpty}</p>
      ) : (
        <ul className="divide-y divide-[var(--color-border)]">
          {list.rows.map((course) => (
            <li key={course.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
              <span className="font-medium text-[var(--color-foreground)]">{course.title}</span>
              <span className="text-sm text-[var(--color-muted-foreground)]">
                {course.status === "published" ? labels.courseStatusPublished : labels.courseStatusDraft}
                {" · "}
                {course.progressMode === "sequential" ? labels.courseModeSequential : labels.courseModeOpen}
                {" · "}
                {course.listedInShop ? labels.courseShopYes : labels.courseShopNo}
              </span>
            </li>
          ))}
        </ul>
      )}
      {pageCount > 1 ? (
        <nav className="flex gap-3 text-sm" aria-label={labels.coursesTab}>
          {list.page > 1 ? (
            <a className="inline-flex min-h-11 items-center gap-1 text-[var(--color-foreground)]" href={pageHref(locale, list.page - 1)}>
              <ChevronLeft className="h-4 w-4" aria-hidden />
              {labels.coursePrev}
            </a>
          ) : null}
          {list.page < pageCount ? (
            <a className="inline-flex min-h-11 items-center gap-1 text-[var(--color-foreground)]" href={pageHref(locale, list.page + 1)}>
              <ChevronRight className="h-4 w-4" aria-hidden />
              {labels.courseNext}
            </a>
          ) : null}
        </nav>
      ) : null}
      <AdminCourseAssignForm locale={locale} courses={list.rows} sections={sections} labels={labels} />
      <AdminCourseGrantForm locale={locale} courses={list.rows} labels={labels} />
      <AdminCourseCreateForm locale={locale} templates={templates} labels={labels} />
    </div>
  );
}
