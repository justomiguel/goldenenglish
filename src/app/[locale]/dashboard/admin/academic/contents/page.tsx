import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { loadGlobalLearningRouteOptions } from "@/lib/learning-content/loadLearningRouteWorkspace";
import { loadPaginatedContentTemplateLibrary } from "@/lib/learning-tasks/loadContentTemplateLibrary";
import { AdminAcademicContentsScreen } from "@/components/admin/AdminAcademicContentsScreen";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sectionId?: string; page?: string; q?: string; tab?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.adminContents.metaTitle,
    robots: { index: false, follow: false },
  };
}

export default async function AdminAcademicContentsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const rawPage = Number.parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const q = typeof sp.q === "string" ? sp.q : "";
  const [globalRepo, routes] = await Promise.all([
    loadPaginatedContentTemplateLibrary(supabase, { page, q }),
    loadGlobalLearningRouteOptions(supabase),
  ]);
  const activeTab = sp.tab === "routes" ? "routes" : "repository";
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
      labels={dict.dashboard.adminContents}
    />
  );
}
