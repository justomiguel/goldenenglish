import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadParentRecentAttendance } from "@/lib/parent/loadParentRecentAttendance";
import { loadParentChildContext } from "@/lib/parent/loadParentChildContext";
import { ParentChildDetailLayout } from "@/components/parent/ParentChildDetailLayout";
import { ParentAttendanceHistory } from "@/components/parent/ParentAttendanceHistory";
import { PARENT_TOUR_ANCHORS } from "@/lib/parent-tutorials/selectors";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ studentId?: string; sectionId?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.parent.childScreen.attendanceTitle);
}

export default async function ParentChildAttendancePage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const dict = await getDictionary(locale);
  const { supabase, userId, focus } = await loadParentChildContext(locale, "/child/attendance", sp);

  const attendance = await loadParentRecentAttendance(supabase, userId);
  const copy = dict.dashboard.parent.childScreen;

  return (
    <ParentChildDetailLayout
      locale={locale}
      title={copy.attendanceTitle}
      lead={copy.attendanceLead}
      backLabel={copy.backToChild}
      studentId={focus.studentId}
      sectionId={focus.sectionId}
      tourAnchor={PARENT_TOUR_ANCHORS.attendanceTitle}
    >
      <div data-tour={PARENT_TOUR_ANCHORS.attendanceBody}>
        <ParentAttendanceHistory
          locale={locale}
          model={attendance}
          labels={dict.dashboard.parent.attendancePwa}
          selectedStudentId={focus.studentId}
          selectedSectionId={focus.sectionId}
        />
      </div>
    </ParentChildDetailLayout>
  );
}
