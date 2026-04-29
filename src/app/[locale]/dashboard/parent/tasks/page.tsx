import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { listTutorStudentsWithFinance } from "@/lib/auth/listTutorStudentsWithFinance";
import { resolveSelectedWard } from "@/lib/parent/resolveSelectedWard";
import { loadStudentLearningTasks } from "@/lib/learning-tasks/loadStudentLearningTasks";
import { StudentLearningTasksEntry } from "@/components/student/StudentLearningTasksEntry";
import { ParentTasksListScreen } from "@/components/parent/ParentTasksListScreen";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ studentId?: string }>;
}

export default async function ParentTasksPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const students = await listTutorStudentsWithFinance(supabase, user.id);
  const selectedStudentId = resolveSelectedWard(
    students,
    typeof sp.studentId === "string" ? sp.studentId : undefined,
  );

  const tasks = selectedStudentId
    ? await loadStudentLearningTasks(supabase, selectedStudentId, 40)
    : [];

  const wardOptions = students.map((s) => ({
    studentId: s.studentId,
    displayName: s.displayName,
  }));

  return (
    <StudentLearningTasksEntry>
      <ParentTasksListScreen
        locale={locale}
        tasks={tasks}
        wardOptions={wardOptions}
        selectedStudentId={selectedStudentId}
        parentLabels={dict.dashboard.parent}
        studentLabels={dict.dashboard.student}
      />
    </StudentLearningTasksEntry>
  );
}
