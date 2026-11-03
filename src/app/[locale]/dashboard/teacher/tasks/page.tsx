import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolveTeacherPortalAccess } from "@/lib/academics/resolveTeacherPortalAccess";
import { parseCatalogMaterialKind } from "@/lib/courses/catalogMaterial";
import { loadContentTemplateLibrary } from "@/lib/learning-tasks/loadContentTemplateLibrary";
import { LearningTaskTemplateLibrary } from "@/components/teacher/LearningTaskTemplateLibrary";
import { TeacherCatalogFilters } from "@/components/teacher/TeacherCatalogFilters";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.teacherNav.tasks);
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tag?: string; material?: string }>;
}

export default async function TeacherTaskLibraryPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const tag = typeof sp.tag === "string" ? sp.tag : "";
  const material = parseCatalogMaterialKind(typeof sp.material === "string" ? sp.material : undefined);
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { allowed } = await resolveTeacherPortalAccess(supabase, user.id);
  if (!allowed) redirect(`/${locale}/dashboard`);
  const templates = await loadContentTemplateLibrary(supabase, 30, { tag, material });
  return (
    <>
      <TeacherCatalogFilters locale={locale} tag={tag} material={material ?? ""} labels={dict.dashboard.adminContents} />
      <LearningTaskTemplateLibrary
        locale={locale}
        templates={templates}
        labels={dict.dashboard.teacherMySections}
        fileUploadProgress={dict.common.fileUpload}
      />
    </>
  );
}
