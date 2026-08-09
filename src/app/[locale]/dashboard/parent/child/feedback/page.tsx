import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadStudentFeedbackTimeline } from "@/lib/parent/loadStudentFeedbackTimeline";
import { loadParentChildContext } from "@/lib/parent/loadParentChildContext";
import { createProgressFailureTracker } from "@/lib/parent/progressFailureTracker";
import { ParentChildDetailLayout } from "@/components/parent/ParentChildDetailLayout";
import { ParentFeedbackSurface } from "@/components/parent/ParentFeedbackSurface";
import { ProgressSectionLoadFailed } from "@/components/parent/ProgressSectionLoadFailed";
import { PARENT_TOUR_ANCHORS } from "@/lib/parent-tutorials/selectors";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ studentId?: string; sectionId?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.parent.childScreen.feedbackTitle);
}

export default async function ParentChildFeedbackPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const dict = await getDictionary(locale);
  const { supabase, focus } = await loadParentChildContext(locale, "/child/feedback", sp);

  const failures = createProgressFailureTracker();
  const timeline = await loadStudentFeedbackTimeline(supabase, {
    studentId: focus.studentId ?? "",
    childLabel: focus.student?.displayName ?? "",
    onLoadError: failures.reporterFor("feedback"),
  });
  const failed = failures.failedSections().includes("feedback");
  const copy = dict.dashboard.parent.childScreen;

  return (
    <ParentChildDetailLayout
      locale={locale}
      title={copy.feedbackTitle}
      lead={copy.feedbackLead}
      backLabel={copy.backToChild}
      studentId={focus.studentId}
      sectionId={focus.sectionId}
      tourAnchor={PARENT_TOUR_ANCHORS.feedbackTitle}
    >
      <div data-tour={PARENT_TOUR_ANCHORS.feedbackBody}>
        {failed ? (
          <ProgressSectionLoadFailed copy={dict.dashboard.parent.progressPicker} />
        ) : (
          <ParentFeedbackSurface
            locale={locale}
            timeline={timeline}
            copy={dict.dashboard.parent.feedback}
          />
        )}
      </div>
    </ParentChildDetailLayout>
  );
}
