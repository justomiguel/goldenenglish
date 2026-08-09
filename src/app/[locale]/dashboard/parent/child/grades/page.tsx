import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadStudentExamResults } from "@/lib/parent/loadStudentExamResults";
import { loadStudentMiniTests } from "@/lib/learning-content/loadStudentMiniTests";
import { loadParentChildContext } from "@/lib/parent/loadParentChildContext";
import { createProgressFailureTracker } from "@/lib/parent/progressFailureTracker";
import { ParentChildDetailLayout } from "@/components/parent/ParentChildDetailLayout";
import { StudentExamResultsSurface } from "@/components/parent/StudentExamResultsSurface";
import { ParentAssessmentsScreen } from "@/components/parent/ParentAssessmentsScreen";
import { ProgressSectionLoadFailed } from "@/components/parent/ProgressSectionLoadFailed";
import { PARENT_TOUR_ANCHORS } from "@/lib/parent-tutorials/selectors";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ studentId?: string; sectionId?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.parent.childScreen.gradesTitle);
}

export default async function ParentChildGradesPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const dict = await getDictionary(locale);
  const { supabase, focus } = await loadParentChildContext(locale, "/child/grades", sp);

  // Exams and mini-tests are one question for a parent — "how did my child score?" — but two
  // reads, so they degrade independently.
  const failures = createProgressFailureTracker();
  const [exams, assessments] = await Promise.all([
    focus.studentId
      ? loadStudentExamResults(supabase, {
          studentId: focus.studentId,
          onLoadError: failures.reporterFor("exams"),
        })
      : Promise.resolve([]),
    focus.studentId
      ? loadStudentMiniTests(supabase, focus.studentId, failures.reporterFor("assessments"))
      : Promise.resolve([]),
  ]);

  const failed = failures.failedSections();
  const copy = dict.dashboard.parent.childScreen;
  const retry = <ProgressSectionLoadFailed copy={dict.dashboard.parent.progressPicker} />;

  return (
    <ParentChildDetailLayout
      locale={locale}
      title={copy.gradesTitle}
      lead={copy.gradesLead}
      backLabel={copy.backToChild}
      studentId={focus.studentId}
      sectionId={focus.sectionId}
      tourAnchor={PARENT_TOUR_ANCHORS.gradesTitle}
    >
      <div className="space-y-5" data-tour={PARENT_TOUR_ANCHORS.gradesBody}>
      <section className="space-y-3">
        <h2 className="font-display text-base font-semibold text-[var(--color-foreground)]">
          {copy.gradesExamsHeading}
        </h2>
        {failed.includes("exams") ? (
          retry
        ) : (
          <StudentExamResultsSurface
            locale={locale}
            exams={exams}
            copy={dict.dashboard.parent.exams}
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-base font-semibold text-[var(--color-foreground)]">
          {copy.gradesAssessmentsHeading}
        </h2>
        {failed.includes("assessments") ? (
          retry
        ) : (
          <ParentAssessmentsScreen
            locale={locale}
            assessments={assessments}
            wardOptions={[]}
            selectedStudentId={focus.studentId}
            parentLabels={dict.dashboard.parent}
            studentLabels={dict.dashboard.student}
            embedded
          />
        )}
      </section>
      </div>
    </ParentChildDetailLayout>
  );
}
