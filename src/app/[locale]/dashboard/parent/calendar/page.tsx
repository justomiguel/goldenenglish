import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { buildPortalCalendarPagePayload } from "@/lib/calendar/buildPortalCalendarPagePayload";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { PortalCalendarEntry } from "@/components/organisms/PortalCalendarEntry";
import { PARENT_TOUR_ANCHORS } from "@/lib/parent-tutorials/selectors";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.parentNav.calendar);
}

/**
 * The agenda only. Attendance history moved to `/parent/child/attendance`, which is
 * what lets the child screen own "how is my child doing?" without swallowing the agenda.
 */
export default async function ParentCalendarPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/parent/calendar`);

  const payload = await buildPortalCalendarPagePayload(supabase, user.id, "parent", {
    locale,
    birthdayCopy: dict.dashboard.birthdays,
  });

  const origin = getPublicSiteUrl()?.origin ?? "";
  const feedUrl =
    payload.feedToken && origin ? `${origin}/api/calendar/feed/${payload.feedToken}.ics` : null;

  return (
    <PortalCalendarEntry
      locale={locale}
      dict={dict.dashboard.portalCalendar}
      events={payload.events}
      feedUrl={feedUrl}
      viewerId={user.id}
      tourAnchors={{
        title: PARENT_TOUR_ANCHORS.calendarTitle,
        schedule: PARENT_TOUR_ANCHORS.calendarBoard,
      }}
    />
  );
}
