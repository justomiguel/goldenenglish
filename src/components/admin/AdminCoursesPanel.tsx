import { ChevronLeft, ChevronRight } from "lucide-react";
import { AdminCourseAssignForm } from "@/components/admin/AdminCourseAssignForm";
import { AdminCourseGrantForm } from "@/components/admin/AdminCourseGrantForm";
import { AdminCourseCatalogTools } from "@/components/admin/AdminCourseCatalogTools";
import { AdminCourseCreateForm } from "@/components/admin/AdminCourseCreateForm";
import type { AdminCourseListPage } from "@/lib/courses/loadAdminCourses";
import type { CourseCatalogSetup } from "@/lib/courses/loadCourseCatalogSetup";
import type { Dictionary } from "@/types/i18n";

const EMPTY_CATALOG: CourseCatalogSetup = { categories: [], fields: [], programs: [], courseOptions: [] };

interface AdminCoursesPanelProps {
  locale: string;
  list: AdminCourseListPage;
  templates: { id: string; title: string }[];
  sections: { id: string; name: string }[];
  labels: Dictionary["dashboard"]["adminContents"];
  catalog?: CourseCatalogSetup;
  categoryId?: string | null;
}

function pageHref(locale: string, page: number, categoryId?: string | null): string {
  const params = new URLSearchParams({ tab: "courses", coursePage: String(page) });
  if (categoryId) params.set("category", categoryId);
  return `/${locale}/dashboard/admin/academic/contents?${params.toString()}`;
}

export function AdminCoursesPanel({
  locale,
  list,
  templates,
  sections,
  labels,
  catalog = EMPTY_CATALOG,
  categoryId = null,
}: AdminCoursesPanelProps) {
  const pageCount = Math.max(1, Math.ceil(list.totalCount / list.pageSize));
  return (
    <div className="space-y-6 px-4 py-4 sm:px-5 sm:py-5">
      <p className="text-sm text-[var(--color-muted-foreground)]">{labels.coursesLead}</p>
      <nav className="flex flex-wrap gap-x-3 gap-y-1 text-sm" aria-label={labels.catalogCategory}>
        <a className="min-h-11 text-[var(--color-foreground)]" href={pageHref(locale, 1, null)}>
          {labels.catalogCategoryNone}
        </a>
        {catalog.categories.map((category) => (
          <a key={category.id} className="min-h-11 text-[var(--color-foreground)]" href={pageHref(locale, 1, category.id)}>
            {category.name}
          </a>
        ))}
      </nav>
      {list.rows.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.coursesEmpty}</p>
      ) : (
        <ul className="divide-y divide-[var(--color-border)]">
          {list.rows.map((course) => (
            <li key={course.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
              <span className="font-medium text-[var(--color-foreground)]">
                {course.title}
                {" · "}
                {course.categoryName ?? labels.catalogCategoryNone}
              </span>
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
            <a className="inline-flex min-h-11 items-center gap-1 text-[var(--color-foreground)]" href={pageHref(locale, list.page - 1, categoryId)}>
              <ChevronLeft className="h-4 w-4" aria-hidden />
              {labels.coursePrev}
            </a>
          ) : null}
          {list.page < pageCount ? (
            <a className="inline-flex min-h-11 items-center gap-1 text-[var(--color-foreground)]" href={pageHref(locale, list.page + 1, categoryId)}>
              <ChevronRight className="h-4 w-4" aria-hidden />
              {labels.courseNext}
            </a>
          ) : null}
        </nav>
      ) : null}
      <AdminCourseAssignForm locale={locale} courses={list.rows} sections={sections} labels={labels} />
      <AdminCourseGrantForm locale={locale} courses={list.rows} labels={labels} />
      <AdminCourseCatalogTools locale={locale} catalog={catalog} sections={sections} labels={labels} />
      <AdminCourseCreateForm
        locale={locale}
        templates={templates}
        categories={catalog.categories}
        fields={catalog.fields}
        labels={labels}
      />
    </div>
  );
}
