import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadStudentLearningTasks } from "@/lib/learning-tasks/loadStudentLearningTasks";
import { loadParentChildContext } from "@/lib/parent/loadParentChildContext";
import { createProgressFailureTracker } from "@/lib/parent/progressFailureTracker";
import { ParentChildDetailLayout } from "@/components/parent/ParentChildDetailLayout";
import { ParentTasksListScreen } from "@/components/parent/ParentTasksListScreen";
import { ProgressSectionLoadFailed } from "@/components/parent/ProgressSectionLoadFailed";
import { PARENT_TOUR_ANCHORS } from "@/lib/parent-tutorials/selectors";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ studentId?: string; sectionId?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.parent.childScreen.tasksTitle);
}

export default async function ParentChildTasksPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const dict = await getDictionary(locale);
  const { supabase, focus } = await loadParentChildContext(locale, "/child/tasks", sp);

  const failures = createProgressFailureTracker();
  const tasks = focus.studentId
    ? await loadStudentLearningTasks(supabase, focus.studentId, 40, failures.reporterFor("tasks"))
    : [];
  const failed = failures.failedSections().includes("tasks");
  const copy = dict.dashboard.parent.childScreen;

  return (
    <ParentChildDetailLayout
      locale={locale}
      title={copy.tasksTitle}
      lead={copy.tasksLead}
      backLabel={copy.backToChild}
      studentId={focus.studentId}
      sectionId={focus.sectionId}
      tourAnchor={PARENT_TOUR_ANCHORS.tasksTitle}
    >
      {failed ? (
        <ProgressSectionLoadFailed copy={dict.dashboard.parent.progressPicker} />
      ) : (
        <ParentTasksListScreen
          locale={locale}
          tasks={tasks}
          wardOptions={[]}
          selectedStudentId={focus.studentId}
          parentLabels={dict.dashboard.parent}
          studentLabels={dict.dashboard.student}
          embedded
        />
      )}
    </ParentChildDetailLayout>
  );
}
