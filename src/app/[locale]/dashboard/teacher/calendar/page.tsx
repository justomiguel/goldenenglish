import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolveTeacherPortalAccess } from "@/lib/academics/resolveTeacherPortalAccess";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { buildPortalCalendarPagePayload } from "@/lib/calendar/buildPortalCalendarPagePayload";
import { PortalCalendarEntry } from "@/components/organisms/PortalCalendarEntry";
import { getDashboardActor } from "@/lib/dashboard/getDashboardActor";
import { getRequestPublicSiteUrl } from "@/lib/site/requestPublicUrl";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.teacherNav.calendar);
}

export default async function TeacherCalendarPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/teacher/calendar`);

  const actor = await getDashboardActor();
  const viewerId = actor?.viewerId ?? user.id;
  const { allowed } = await resolveTeacherPortalAccess(supabase, user.id);
  if (!allowed && !actor?.viewAs) {
    const isAdmin = await resolveIsAdminSession(supabase, user.id);
    if (isAdmin) redirect(`/${locale}/dashboard/admin/calendar`);
    redirect(`/${locale}/dashboard`);
  }

  const payload = await buildPortalCalendarPagePayload(supabase, viewerId, "teacher", {
    locale,
    birthdayCopy: dict.dashboard.birthdays,
  });
  const origin = (await getRequestPublicSiteUrl())?.origin ?? "";
  const feedUrl = payload.feedToken && origin ? `${origin}/api/calendar/feed/${payload.feedToken}.ics` : null;

  return (
    <PortalCalendarEntry
      locale={locale}
      dict={dict.dashboard.portalCalendar}
      events={payload.events}
      feedUrl={feedUrl}
      viewerId={viewerId}
    />
  );
}
