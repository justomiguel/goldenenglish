import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/site/publicUrl";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { loadStudentLearningTasks } from "@/lib/learning-tasks/loadStudentLearningTasks";
import { loadStudentMiniTests } from "@/lib/learning-content/loadStudentMiniTests";
import { loadStudentLearningFeedback } from "@/lib/learning-content/loadStudentLearningFeedback";
import { loadStudentBadgeDisplayRows } from "@/lib/badges/loadStudentBadgeDisplayRows";
import { ParentProgressEntry } from "@/components/parent/ParentProgressEntry";
import type { ParentLearningFeedbackRow } from "@/lib/learning-content/loadParentLearningFeedback";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}

function ProgressFallback() {
  return (
    <div className="h-40 animate-pulse rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]" aria-hidden />
  );
}

export default async function StudentProgressPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  await searchParams;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/student/progress`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "student") redirect(`/${locale}/dashboard`);

  const studentId = user.id;
  const displayName = formatProfileNameSurnameFirst(profile.first_name, profile.last_name);
  const wardOptions = [{ studentId, displayName: displayName || studentId }];

  const [tasks, assessments, rawFeedback, badgeRows] = await Promise.all([
    loadStudentLearningTasks(supabase, studentId, 40),
    loadStudentMiniTests(supabase, studentId),
    loadStudentLearningFeedback(supabase, studentId, 12),
    loadStudentBadgeDisplayRows(studentId, (token) => {
      const u = absoluteUrl(`/${locale}/b/${token}`);
      return u ? u.toString() : "";
    }),
  ]);

  const feedback: ParentLearningFeedbackRow[] = rawFeedback.map((row) => ({
    ...row,
    studentId,
    childLabel: displayName || studentId,
  }));

  return (
    <Suspense fallback={<ProgressFallback />}>
      <ParentProgressEntry
        locale={locale}
        wardOptions={wardOptions}
        selectedStudentId={studentId}
        tasks={tasks}
        assessments={assessments}
        feedback={feedback}
        badgeRows={badgeRows}
        parentLabels={dict.dashboard.parent}
        studentLabels={dict.dashboard.student}
        badgesDict={dict.dashboard.student.badges}
        navDict={dict.dashboard.parentNav}
        progressBasePath={`/${locale}/dashboard/student/progress`}
      />
    </Suspense>
  );
}
