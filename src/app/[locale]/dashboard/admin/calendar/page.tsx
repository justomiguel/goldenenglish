import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { buildPortalCalendarPagePayload } from "@/lib/calendar/buildPortalCalendarPagePayload";
import { PortalCalendarEntry } from "@/components/organisms/PortalCalendarEntry";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.portalCalendar.title,
    robots: { index: false, follow: false },
  };
}

export default async function AdminCalendarPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sp = await searchParams;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/admin/calendar`);

  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (!isAdmin) redirect(`/${locale}/dashboard`);

  const teacherRaw = typeof sp.teacher === "string" ? sp.teacher : "";
  const roomRaw = typeof sp.room === "string" ? sp.room : "";

  const payload = await buildPortalCalendarPagePayload(supabase, user.id, "admin", {
    adminTeacherId: teacherRaw.trim() || null,
    adminRoom: roomRaw.trim() || null,
  });
  const origin = getPublicSiteUrl()?.origin ?? "";
  const feedUrl = payload.feedToken && origin ? `${origin}/api/calendar/feed/${payload.feedToken}.ics` : null;

  return (
    <PortalCalendarEntry
      locale={locale}
      dict={dict.dashboard.portalCalendar}
      lead={dict.dashboard.portalCalendar.adminLead}
      events={payload.events}
      feedUrl={feedUrl}
      viewerId={user.id}
      admin={{
        teachers: payload.teacherOptions,
        rooms: payload.roomOptions,
        teacherId: teacherRaw.trim(),
        room: roomRaw.trim(),
      }}
      adminSpecialEventsHref={`/${locale}/dashboard/admin/calendar/special`}
    />
  );
}
