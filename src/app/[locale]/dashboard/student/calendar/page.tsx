import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { buildPortalCalendarPagePayload } from "@/lib/calendar/buildPortalCalendarPagePayload";
import { loadFamilyHubModelForStudentIds } from "@/lib/parent/loadFamilyHubModelForStudentIds";
import { loadRecentAttendanceForStudentIds } from "@/lib/parent/loadRecentAttendanceForStudentIds";
import { ParentPortalCalendarEntry } from "@/components/parent/ParentPortalCalendarEntry";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { requirePortalPageActor } from "@/lib/dashboard/requirePortalPageActor";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.studentNav.calendar);
}

export default async function StudentCalendarPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const { supabase, viewerId } = await requirePortalPageActor(
    locale,
    "student",
    `/${locale}/dashboard/student/calendar`,
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", viewerId)
    .maybeSingle();

  const studentId = viewerId;
  const displayName = formatProfileNameSurnameFirst(profile?.first_name, profile?.last_name);
  const wardOptions = [{ studentId, displayName: displayName || studentId }];

  const payload = await buildPortalCalendarPagePayload(supabase, viewerId, "student", {
    locale,
    birthdayCopy: dict.dashboard.birthdays,
  });
  const [hub, attendance] = await Promise.all([
    loadFamilyHubModelForStudentIds(
      supabase,
      [studentId],
      locale,
      dict.dashboard.parent.hub.icsEventTitle,
    ),
    loadRecentAttendanceForStudentIds(supabase, [studentId]),
  ]);

  const origin = getPublicSiteUrl()?.origin ?? "";
  const feedUrl = payload.feedToken && origin ? `${origin}/api/calendar/feed/${payload.feedToken}.ics` : null;

  return (
    <ParentPortalCalendarEntry
      locale={locale}
      dict={dict.dashboard.portalCalendar}
      attendanceLabels={dict.dashboard.parent.attendancePwa}
      wardPickerLabel={dict.dashboard.parent.wardPickerLabel}
      wardPickerHint={dict.dashboard.parent.wardPickerHint}
      wardOptions={wardOptions}
      selectedStudentId={studentId}
      events={payload.events}
      feedUrl={feedUrl}
      viewerId={viewerId}
      attendance={attendance}
      hub={hub}
      hubDict={dict.dashboard.parent.hub}
    />
  );
}
