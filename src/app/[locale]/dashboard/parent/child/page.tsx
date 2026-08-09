import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { absoluteUrl } from "@/lib/site/publicUrl";
import { loadParentChildContext } from "@/lib/parent/loadParentChildContext";
import { loadParentRecentAttendance } from "@/lib/parent/loadParentRecentAttendance";
import { loadStudentExamResults } from "@/lib/parent/loadStudentExamResults";
import { loadStudentLearningTasks } from "@/lib/learning-tasks/loadStudentLearningTasks";
import { loadStudentFeedbackTimeline } from "@/lib/parent/loadStudentFeedbackTimeline";
import { loadStudentBadgeDisplayRows } from "@/lib/badges/loadStudentBadgeDisplayRows";
import { buildParentChildMetrics } from "@/lib/parent/buildParentChildMetrics";
import { withParentFocusHref } from "@/lib/parent/withParentFocusHref";
import { resolveBadgeTranslation } from "@/lib/badges/badgeCatalog";
import { ParentChildScreen } from "@/components/parent/ParentChildScreen";
import type { ParentChildPreviewItem } from "@/components/parent/ParentChildSectionCard";
import type { ParentRecentAttendanceModel } from "@/lib/parent/loadParentRecentAttendance";
import type { StudentExamResult } from "@/types/studentExams";
import type { StudentLearningTaskRow } from "@/types/learningTasks";
import type { ParentFeedbackTimeline } from "@/types/parentFeedback";
import type { StudentBadgeRowModel } from "@/types/studentBadges";

const PREVIEW_LIMIT = 3;
const PENDING = new Set<StudentLearningTaskRow["status"]>(["NOT_OPENED", "OPENED"]);

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ studentId?: string; sectionId?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.parent.childScreen.navLabel);
}

/** `allSettled` over the six reads, so one broken section never blanks the screen. */
function settled<T>(result: PromiseSettledResult<T>, fallback: T): { value: T; failed: boolean } {
  return result.status === "fulfilled"
    ? { value: result.value, failed: false }
    : { value: fallback, failed: true };
}

function formatDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}

export default async function ParentChildPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const dict = await getDictionary(locale);
  const { supabase, userId, focus } = await loadParentChildContext(locale, "/child", sp);

  const copy = dict.dashboard.parent.childScreen;
  const focusParams = { studentId: focus.studentId, sectionId: focus.sectionId };
  const href = (suffix: string) =>
    withParentFocusHref(`/${locale}/dashboard/parent/child${suffix}`, focusParams);

  if (!focus.studentId) {
    return (
      <p className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-8 text-center text-sm text-[var(--color-muted-foreground)]">
        {copy.noChild}
      </p>
    );
  }

  const studentId = focus.studentId;
  const [attendanceResult, examsResult, tasksResult, feedbackResult, badgesResult] =
    await Promise.allSettled([
      loadParentRecentAttendance(supabase, userId),
      loadStudentExamResults(supabase, { studentId }),
      loadStudentLearningTasks(supabase, studentId, 40),
      loadStudentFeedbackTimeline(supabase, {
        studentId,
        childLabel: focus.student?.displayName ?? "",
      }),
      loadStudentBadgeDisplayRows(
        studentId,
        (token) => absoluteUrl(`/${locale}/b/${token}`)?.toString() ?? "",
      ),
    ]);

  const emptyAttendance: ParentRecentAttendanceModel = {
    children: [],
    marks: [],
    sectionSummaries: [],
    requiredMinPercent: 0,
  };
  const attendance = settled(attendanceResult, emptyAttendance);
  const exams = settled<StudentExamResult[]>(examsResult, []);
  const tasks = settled<StudentLearningTaskRow[]>(tasksResult, []);
  const feedback = settled<ParentFeedbackTimeline>(feedbackResult, { items: [], newCount: 0 });
  const badges = settled<StudentBadgeRowModel[]>(badgesResult, []);

  const metrics = buildParentChildMetrics({
    now: new Date(),
    sectionId: focus.sectionId,
    attendanceSummaries: attendance.value.sectionSummaries.filter(
      (summary) => summary.studentId === studentId,
    ),
    exams: exams.value,
    tasks: tasks.value,
  });

  const attendanceItems: ParentChildPreviewItem[] = attendance.value.sectionSummaries
    .filter((summary) => summary.studentId === studentId)
    .slice(0, PREVIEW_LIMIT)
    .map((summary) => ({
      id: summary.sectionId,
      primary: summary.sectionName,
      trailing: summary.monthPercent === null ? undefined : `${summary.monthPercent}%`,
    }));

  const gradeItems: ParentChildPreviewItem[] = exams.value
    .slice(0, PREVIEW_LIMIT)
    .map((examResult) => ({
      id: examResult.id,
      primary: examResult.name,
      secondary: formatDate(examResult.examOn, locale),
      trailing:
        examResult.score !== null && examResult.maxScore !== null
          ? `${examResult.score}/${examResult.maxScore}`
          : undefined,
    }));

  const feedbackItems: ParentChildPreviewItem[] = feedback.value.items
    .slice(0, PREVIEW_LIMIT)
    .map((item) => ({
      id: item.id,
      primary: item.title,
      secondary: item.teacherName ?? item.contextLabel,
      trailing: formatDate(item.occurredOn, locale),
    }));

  const taskItems: ParentChildPreviewItem[] = tasks.value
    .filter((task) => PENDING.has(task.status))
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))
    .slice(0, PREVIEW_LIMIT)
    .map((task) => ({
      id: task.taskInstanceId,
      primary: task.title,
      secondary: formatDate(task.dueAt, locale),
      trailing: dict.dashboard.student.taskStatus[task.status],
    }));

  const badgeItems: ParentChildPreviewItem[] = badges.value
    .filter((row) => !row.locked)
    .slice(0, PREVIEW_LIMIT)
    .map((row) => ({
      id: row.id,
      primary: row.catalog
        ? resolveBadgeTranslation(
            { code: row.badgeCode, translations: row.catalog.translations },
            locale,
          ).title
        : row.badgeCode,
      secondary: row.earnedAt ? formatDate(row.earnedAt, locale) : undefined,
    }));

  return (
    <ParentChildScreen
      title={focus.student?.displayName ?? copy.navLabel}
      subtitle={focus.section?.classLabel || copy.noTeacher}
      copy={copy}
      metrics={metrics}
      metricHrefs={{
        attendance: href("/attendance"),
        average: href("/grades"),
        pendingTasks: href("/tasks"),
      }}
      failedLabel={dict.dashboard.parent.progressPicker.loadFailedTitle}
      sections={[
        {
          id: "attendance",
          title: copy.sectionAttendance,
          href: href("/attendance"),
          emptyLabel: copy.emptyAttendance,
          items: attendanceItems,
          failed: attendance.failed,
        },
        {
          id: "grades",
          title: copy.sectionGrades,
          href: href("/grades"),
          emptyLabel: copy.emptyGrades,
          items: gradeItems,
          failed: exams.failed,
        },
        {
          id: "feedback",
          title: copy.sectionFeedback,
          href: href("/feedback"),
          emptyLabel: copy.emptyFeedback,
          items: feedbackItems,
          failed: feedback.failed,
        },
        {
          id: "tasks",
          title: copy.sectionTasks,
          href: href("/tasks"),
          emptyLabel: copy.emptyTasks,
          items: taskItems,
          failed: tasks.failed,
        },
        {
          id: "badges",
          title: copy.sectionBadges,
          href: href("/badges"),
          emptyLabel: copy.emptyBadges,
          items: badgeItems,
          failed: badges.failed,
        },
      ]}
    />
  );
}
