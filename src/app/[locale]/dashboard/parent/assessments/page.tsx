import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { listTutorStudentsWithFinance } from "@/lib/auth/listTutorStudentsWithFinance";
import { resolveSelectedWard } from "@/lib/parent/resolveSelectedWard";
import { loadStudentMiniTests } from "@/lib/learning-content/loadStudentMiniTests";
import { StudentLearningTasksEntry } from "@/components/student/StudentLearningTasksEntry";
import { ParentAssessmentsScreen } from "@/components/parent/ParentAssessmentsScreen";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ studentId?: string }>;
}

export default async function ParentAssessmentsPage({ params, searchParams }: PageProps) {
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

  const assessments = selectedStudentId
    ? await loadStudentMiniTests(supabase, selectedStudentId)
    : [];

  const wardOptions = students.map((s) => ({
    studentId: s.studentId,
    displayName: s.displayName,
  }));

  return (
    <StudentLearningTasksEntry>
      <ParentAssessmentsScreen
        locale={locale}
        assessments={assessments}
        wardOptions={wardOptions}
        selectedStudentId={selectedStudentId}
        parentLabels={dict.dashboard.parent}
        studentLabels={dict.dashboard.student}
      />
    </StudentLearningTasksEntry>
  );
}
