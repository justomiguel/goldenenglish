import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/site/publicUrl";
import { listTutorStudentsWithFinance } from "@/lib/auth/listTutorStudentsWithFinance";
import { resolveSelectedWard } from "@/lib/parent/resolveSelectedWard";
import { loadStudentLearningTasks } from "@/lib/learning-tasks/loadStudentLearningTasks";
import { loadStudentMiniTests } from "@/lib/learning-content/loadStudentMiniTests";
import { loadParentLearningFeedback } from "@/lib/learning-content/loadParentLearningFeedback";
import { loadStudentBadgeDisplayRows } from "@/lib/badges/loadStudentBadgeDisplayRows";
import { ParentProgressEntry } from "@/components/parent/ParentProgressEntry";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ studentId?: string; tab?: string }>;
}

function ProgressFallback() {
  return (
    <div className="h-40 animate-pulse rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]" aria-hidden />
  );
}

export default async function ParentProgressPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/parent/progress`);

  const students = await listTutorStudentsWithFinance(supabase, user.id);
  const selectedStudentId = resolveSelectedWard(
    students,
    typeof sp.studentId === "string" ? sp.studentId : undefined,
  );

  const wardOptions = students.map((s) => ({
    studentId: s.studentId,
    displayName: s.displayName,
  }));

  const [tasks, assessments, feedback, badgeRows] = await Promise.all([
    selectedStudentId ? loadStudentLearningTasks(supabase, selectedStudentId, 40) : Promise.resolve([]),
    selectedStudentId ? loadStudentMiniTests(supabase, selectedStudentId) : Promise.resolve([]),
    loadParentLearningFeedback(supabase, user.id),
    selectedStudentId
      ? loadStudentBadgeDisplayRows(selectedStudentId, (token) => {
          const u = absoluteUrl(`/${locale}/b/${token}`);
          return u ? u.toString() : "";
        })
      : Promise.resolve([]),
  ]);

  return (
    <Suspense fallback={<ProgressFallback />}>
      <ParentProgressEntry
        locale={locale}
        wardOptions={wardOptions}
        selectedStudentId={selectedStudentId}
        tasks={tasks}
        assessments={assessments}
        feedback={feedback}
        badgeRows={badgeRows}
        parentLabels={dict.dashboard.parent}
        studentLabels={dict.dashboard.student}
        badgesDict={dict.dashboard.student.badges}
        navDict={dict.dashboard.parentNav}
      />
    </Suspense>
  );
}
