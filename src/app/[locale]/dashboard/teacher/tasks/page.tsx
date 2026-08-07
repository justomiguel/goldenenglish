import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolveTeacherPortalAccess } from "@/lib/academics/resolveTeacherPortalAccess";
import { loadContentTemplateLibrary } from "@/lib/learning-tasks/loadContentTemplateLibrary";
import { LearningTaskTemplateLibrary } from "@/components/teacher/LearningTaskTemplateLibrary";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.teacherNav.tasks);
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function TeacherTaskLibraryPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { allowed } = await resolveTeacherPortalAccess(supabase, user.id);
  if (!allowed) redirect(`/${locale}/dashboard`);
  const templates = await loadContentTemplateLibrary(supabase);
  return (
    <LearningTaskTemplateLibrary
      locale={locale}
      templates={templates}
      labels={dict.dashboard.teacherMySections}
      fileUploadProgress={dict.common.fileUpload}
    />
  );
}
