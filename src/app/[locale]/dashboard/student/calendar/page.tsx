import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { buildPortalCalendarPagePayload } from "@/lib/calendar/buildPortalCalendarPagePayload";
import { loadFamilyHubModelForStudentIds } from "@/lib/parent/loadFamilyHubModelForStudentIds";
import { loadRecentAttendanceForStudentIds } from "@/lib/parent/loadRecentAttendanceForStudentIds";
import { ParentPortalCalendarEntry } from "@/components/parent/ParentPortalCalendarEntry";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const attendanceTitle = dict.dashboard.parent.attendancePwa.title;
  return {
    title: attendanceTitle,
    robots: { index: false, follow: false },
  };
}

export default async function StudentCalendarPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/student/calendar`);

  const { data: profile } = await supabase.from("profiles").select("role, first_name, last_name").eq("id", user.id).maybeSingle();
  if (profile?.role !== "student") redirect(`/${locale}/dashboard`);

  const studentId = user.id;
  const displayName = formatProfileNameSurnameFirst(profile.first_name, profile.last_name);
  const wardOptions = [{ studentId, displayName: displayName || studentId }];

  const payload = await buildPortalCalendarPagePayload(supabase, user.id, "student", {
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
      viewerId={user.id}
      attendance={attendance}
      hub={hub}
      hubDict={dict.dashboard.parent.hub}
    />
  );
}
