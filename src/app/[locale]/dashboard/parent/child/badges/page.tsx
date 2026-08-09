import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { absoluteUrl } from "@/lib/site/publicUrl";
import { loadStudentBadgeDisplayRows } from "@/lib/badges/loadStudentBadgeDisplayRows";
import { loadParentChildContext } from "@/lib/parent/loadParentChildContext";
import { createProgressFailureTracker } from "@/lib/parent/progressFailureTracker";
import { ParentChildDetailLayout } from "@/components/parent/ParentChildDetailLayout";
import { ParentBadgesScreen } from "@/components/parent/ParentBadgesScreen";
import { ProgressSectionLoadFailed } from "@/components/parent/ProgressSectionLoadFailed";
import { PARENT_TOUR_ANCHORS } from "@/lib/parent-tutorials/selectors";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ studentId?: string; sectionId?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.parent.childScreen.badgesTitle);
}

export default async function ParentChildBadgesPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const dict = await getDictionary(locale);
  const { focus } = await loadParentChildContext(locale, "/child/badges", sp);

  const failures = createProgressFailureTracker();
  const rows = focus.studentId
    ? await loadStudentBadgeDisplayRows(
        focus.studentId,
        (token) => absoluteUrl(`/${locale}/b/${token}`)?.toString() ?? "",
        failures.reporterFor("badges"),
      )
    : [];
  const failed = failures.failedSections().includes("badges");
  const copy = dict.dashboard.parent.childScreen;

  return (
    <ParentChildDetailLayout
      locale={locale}
      title={copy.badgesTitle}
      lead={copy.badgesLead}
      backLabel={copy.backToChild}
      studentId={focus.studentId}
      sectionId={focus.sectionId}
      tourAnchor={PARENT_TOUR_ANCHORS.badgesTitle}
    >
      {failed ? (
        <ProgressSectionLoadFailed copy={dict.dashboard.parent.progressPicker} />
      ) : (
        <ParentBadgesScreen
          locale={locale}
          rows={rows}
          wardOptions={[]}
          selectedStudentId={focus.studentId}
          parentLabels={dict.dashboard.parent}
          badgesDict={dict.dashboard.student.badges}
          embedded
        />
      )}
    </ParentChildDetailLayout>
  );
}
