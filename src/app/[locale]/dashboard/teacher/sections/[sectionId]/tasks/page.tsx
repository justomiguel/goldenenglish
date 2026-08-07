import { notFound, redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolveTeacherPortalAccess } from "@/lib/academics/resolveTeacherPortalAccess";
import { userIsSectionTeacherOrAssistant } from "@/lib/academics/userIsSectionTeacherOrAssistant";
import { loadContentTemplateLibrary } from "@/lib/learning-tasks/loadContentTemplateLibrary";
import { loadTeacherSectionLearningTasks } from "@/lib/learning-tasks/loadTeacherSectionLearningTasks";
import { TeacherSectionLearningTasks } from "@/components/teacher/TeacherSectionLearningTasks";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; sectionId: string }> }) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.teacherMySections.rosterLinkTasks);
}

interface PageProps {
  params: Promise<{ locale: string; sectionId: string }>;
}

export default async function TeacherSectionTasksPage({ params }: PageProps) {
  const { locale, sectionId } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { allowed } = await resolveTeacherPortalAccess(supabase, user.id);
  if (!allowed) redirect(`/${locale}/dashboard`);
  const canOpen = await userIsSectionTeacherOrAssistant(supabase, user.id, sectionId);
  if (!canOpen) notFound();

  const [templates, tasks] = await Promise.all([
    loadContentTemplateLibrary(supabase),
    loadTeacherSectionLearningTasks(supabase, sectionId),
  ]);
  return (
    <TeacherSectionLearningTasks
      locale={locale}
      sectionId={sectionId}
      templates={templates}
      tasks={tasks}
      labels={dict.dashboard.teacherMySections}
    />
  );
}
