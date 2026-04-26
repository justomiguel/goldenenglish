import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { loadStudentMiniTests } from "@/lib/learning-content/loadStudentMiniTests";
import { StudentLearningTasksEntry } from "@/components/student/StudentLearningTasksEntry";
import { StudentMiniTestsSection } from "@/components/student/StudentMiniTestsSection";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function StudentAssessmentsPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const assessments = await loadStudentMiniTests(supabase, user.id);
  return (
    <StudentLearningTasksEntry>
      <StudentMiniTestsSection
        locale={locale}
        assessments={assessments}
        labels={dict.dashboard.student}
      />
    </StudentLearningTasksEntry>
  );
}
