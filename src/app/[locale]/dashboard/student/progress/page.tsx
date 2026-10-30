import { Suspense } from "react";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getRequestPublicSiteUrl } from "@/lib/site/requestPublicUrl";
import { buildBadgeSharePath } from "@/lib/site/publicSharePaths";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { loadStudentLearningTasks } from "@/lib/learning-tasks/loadStudentLearningTasks";
import { loadStudentMiniTests } from "@/lib/learning-content/loadStudentMiniTests";
import { loadStudentFeedbackTimeline } from "@/lib/parent/loadStudentFeedbackTimeline";
import { loadStudentExamResults } from "@/lib/parent/loadStudentExamResults";
import { loadStudentBadgeDisplayRows } from "@/lib/badges/loadStudentBadgeDisplayRows";
import { loadStudentCourses } from "@/lib/courses/loadStudentCourses";
import { createProgressFailureTracker } from "@/lib/parent/progressFailureTracker";
import { ParentProgressEntry } from "@/components/parent/ParentProgressEntry";
import { requirePortalPageActor } from "@/lib/dashboard/requirePortalPageActor";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.studentNav.progress);
}

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
  const { supabase, viewerId } = await requirePortalPageActor(
    locale,
    "student",
    `/${locale}/dashboard/student/progress`,
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", viewerId)
    .maybeSingle();

  const studentId = viewerId;
  const displayName = formatProfileNameSurnameFirst(profile?.first_name, profile?.last_name);
  const wardOptions = [{ studentId, displayName: displayName || studentId }];

  // A read that fails must reach the screen: Progress hides empty sections, so a swallowed error
  // would tell the family their child has nothing.
  const failures = createProgressFailureTracker();

  const shareOrigin = (await getRequestPublicSiteUrl())?.origin ?? "";
  const badgeShareUrl = (token: string, title?: string) => {
    const path = buildBadgeSharePath(locale, title ?? "", token);
    if (!shareOrigin) return path;
    return new URL(path, shareOrigin).toString();
  };
  const [exams, tasks, assessments, feedback, badgeRows, courses] = await Promise.all([
    loadStudentExamResults(supabase, {
      studentId,
      onLoadError: failures.reporterFor("exams"),
    }),
    loadStudentLearningTasks(supabase, studentId, 40, failures.reporterFor("tasks")),
    loadStudentMiniTests(supabase, studentId, failures.reporterFor("assessments")),
    loadStudentFeedbackTimeline(supabase, {
      studentId,
      childLabel: displayName || studentId,
      onLoadError: failures.reporterFor("feedback"),
    }),
    loadStudentBadgeDisplayRows(studentId, badgeShareUrl, failures.reporterFor("badges")),
    loadStudentCourses(supabase, studentId, failures.reporterFor("courses")),
  ]);

  return (
    <Suspense fallback={<ProgressFallback />}>
      <ParentProgressEntry
        locale={locale}
        wardOptions={wardOptions}
        selectedStudentId={studentId}
        exams={exams}
        tasks={tasks}
        assessments={assessments}
        feedback={feedback}
        badgeRows={badgeRows}
        courses={courses}
        failedSections={failures.failedSections()}
        parentLabels={dict.dashboard.parent}
        studentLabels={dict.dashboard.student}
        badgesDict={dict.dashboard.student.badges}
        progressBasePath={`/${locale}/dashboard/student/progress`}
      />
    </Suspense>
  );
}
