import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolveTutorStudentLink } from "@/lib/auth/resolveTutorStudentLink";
import { loadStudentLearningTasks } from "@/lib/learning-tasks/loadStudentLearningTasks";
import { StudentLearningTasksEntry } from "@/components/student/StudentLearningTasksEntry";
import { ParentTaskDetailScreen } from "@/components/parent/ParentTaskDetailScreen";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string; taskInstanceId: string }>;
  searchParams: Promise<{ studentId?: string }>;
}

export default async function ParentTaskDetailPage({ params, searchParams }: PageProps) {
  const { locale, taskInstanceId } = await params;
  const sp = await searchParams;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const studentId = typeof sp.studentId === "string" ? sp.studentId : null;
  if (!studentId) notFound();

  const link = await resolveTutorStudentLink(supabase, user.id, studentId);
  if (!link.linked) notFound();

  const tasks = await loadStudentLearningTasks(supabase, studentId, 80);
  const task = tasks.find((row) => row.taskInstanceId === taskInstanceId);
  if (!task) notFound();

  return (
    <StudentLearningTasksEntry>
      <ParentTaskDetailScreen
        locale={locale}
        task={task}
        studentLabels={dict.dashboard.student}
        readOnlyNotice={dict.dashboard.parent.assessmentsPageReadOnly}
      />
    </StudentLearningTasksEntry>
  );
}
