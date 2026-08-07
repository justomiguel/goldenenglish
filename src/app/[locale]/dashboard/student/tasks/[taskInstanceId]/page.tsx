import { notFound, redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { loadStudentLearningTasks } from "@/lib/learning-tasks/loadStudentLearningTasks";
import { StudentLearningTasksEntry } from "@/components/student/StudentLearningTasksEntry";
import { StudentLearningTaskDetail } from "@/components/student/StudentLearningTaskDetail";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; taskInstanceId: string }> }) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.studentNav.tasks);
}

interface PageProps {
  params: Promise<{ locale: string; taskInstanceId: string }>;
}

export default async function StudentTaskDetailPage({ params }: PageProps) {
  const { locale, taskInstanceId } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const tasks = await loadStudentLearningTasks(supabase, user.id, 80);
  const task = tasks.find((row) => row.taskInstanceId === taskInstanceId);
  if (!task) notFound();
  return (
    <StudentLearningTasksEntry>
      <StudentLearningTaskDetail locale={locale} task={task} labels={dict.dashboard.student} />
    </StudentLearningTasksEntry>
  );
}
