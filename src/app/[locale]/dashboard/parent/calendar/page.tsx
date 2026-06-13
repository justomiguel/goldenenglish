import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { buildPortalCalendarPagePayload } from "@/lib/calendar/buildPortalCalendarPagePayload";
import { listTutorStudentsWithFinance } from "@/lib/auth/listTutorStudentsWithFinance";
import { loadParentFamilyHubModel } from "@/lib/parent/loadParentFamilyHubModel";
import { resolveSelectedWard } from "@/lib/parent/resolveSelectedWard";
import { ParentPortalCalendarEntry } from "@/components/parent/ParentPortalCalendarEntry";
import { loadParentRecentAttendance } from "@/lib/parent/loadParentRecentAttendance";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ studentId?: string }>;
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

export default async function ParentCalendarPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/parent/calendar`);

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "parent") redirect(`/${locale}/dashboard`);

  const payload = await buildPortalCalendarPagePayload(supabase, user.id, "parent", {
    locale,
    birthdayCopy: dict.dashboard.birthdays,
  });
  const [hub, attendance, students] = await Promise.all([
    loadParentFamilyHubModel(
      supabase,
      user.id,
      locale,
      dict.dashboard.parent.hub.icsEventTitle,
    ),
    loadParentRecentAttendance(supabase, user.id),
    listTutorStudentsWithFinance(supabase, user.id),
  ]);
  const wardOptions = students.map((s) => ({
    studentId: s.studentId,
    displayName: s.displayName,
  }));
  const selectedStudentId = resolveSelectedWard(
    students,
    typeof sp.studentId === "string" ? sp.studentId : undefined,
  );
  const origin = getPublicSiteUrl()?.origin ?? "";
  const feedUrl = payload.feedToken && origin ? `${origin}/api/calendar/feed/${payload.feedToken}.ics` : null;

  return (
    <>
      <ParentPortalCalendarEntry
        locale={locale}
        dict={dict.dashboard.portalCalendar}
        attendanceLabels={dict.dashboard.parent.attendancePwa}
        wardPickerLabel={dict.dashboard.parent.wardPickerLabel}
        wardPickerHint={dict.dashboard.parent.wardPickerHint}
        wardOptions={wardOptions}
        selectedStudentId={selectedStudentId}
        events={payload.events}
        feedUrl={feedUrl}
        viewerId={user.id}
        attendance={attendance}
        hub={hub}
        hubDict={dict.dashboard.parent.hub}
      />
    </>
  );
}
