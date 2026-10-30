import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { loadGlobalLearningRouteOptions } from "@/lib/learning-content/loadLearningRouteWorkspace";
import { loadPaginatedContentTemplateLibrary } from "@/lib/learning-tasks/loadContentTemplateLibrary";
import { AdminAcademicContentsScreen } from "@/components/admin/AdminAcademicContentsScreen";
import { loadAdminCourses } from "@/lib/courses/loadAdminCourses";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sectionId?: string; page?: string; q?: string; tab?: string; coursePage?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.adminContents.title);
}

export default async function AdminAcademicContentsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const rawPage = Number.parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const q = typeof sp.q === "string" ? sp.q : "";
  const coursePage = Number.parseInt(sp.coursePage ?? "1", 10);
  const [globalRepo, routes, courses, sectionResult] = await Promise.all([
    loadPaginatedContentTemplateLibrary(supabase, { page, q }),
    loadGlobalLearningRouteOptions(supabase),
    loadAdminCourses(supabase, coursePage),
    supabase.from("academic_sections").select("id, name").order("name", { ascending: true }).range(0, 199),
  ]);
  if (sectionResult.error) {
    logSupabaseClientError("adminContents:sections", sectionResult.error, {});
  }
  const sections = (sectionResult.data ?? []).map((row) => ({ id: String(row.id), name: String(row.name) }));
  const activeTab = sp.tab === "routes" || sp.tab === "courses" ? sp.tab : "repository";
  return (
    <AdminAcademicContentsScreen
      locale={locale}
      activeTab={activeTab}
      routes={routes}
      globalContents={globalRepo.rows}
      repositoryPagination={{
        page: globalRepo.page,
        pageSize: globalRepo.pageSize,
        totalCount: globalRepo.totalCount,
        searchQuery: q,
      }}
      courses={courses}
      sections={sections}
      labels={dict.dashboard.adminContents}
    />
  );
}
