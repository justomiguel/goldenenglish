import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { loadContentSections } from "@/lib/learning-content/loadContentSections";
import { loadSectionContentWorkspace } from "@/lib/learning-content/loadSectionContentWorkspace";
import { loadContentTemplateLibrary } from "@/lib/learning-tasks/loadContentTemplateLibrary";
import { AdminAcademicContentsScreen } from "@/components/admin/AdminAcademicContentsScreen";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sectionId?: string }>;
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
  const [sections, globalContents] = await Promise.all([
    loadContentSections(supabase),
    loadContentTemplateLibrary(supabase, 80),
  ]);
  const selectedSectionId =
    sp.sectionId && sections.some((section) => section.id === sp.sectionId)
      ? sp.sectionId
      : sections[0]?.id ?? null;
  const workspace = selectedSectionId
    ? await loadSectionContentWorkspace(supabase, selectedSectionId)
    : null;

  return (
    <AdminAcademicContentsScreen
      locale={locale}
      sections={sections}
      selectedSectionId={selectedSectionId}
      workspace={workspace}
      globalContents={globalContents}
      labels={dict.dashboard.adminContents}
    />
  );
}
