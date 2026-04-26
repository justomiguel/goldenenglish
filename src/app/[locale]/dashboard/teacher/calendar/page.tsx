import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolveTeacherPortalAccess } from "@/lib/academics/resolveTeacherPortalAccess";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { buildPortalCalendarPagePayload } from "@/lib/calendar/buildPortalCalendarPagePayload";
import { PortalCalendarEntry } from "@/components/organisms/PortalCalendarEntry";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.portalCalendar.title,
    robots: { index: false, follow: false },
  };
}

export default async function TeacherCalendarPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/teacher/calendar`);

  const { allowed } = await resolveTeacherPortalAccess(supabase, user.id);
  if (!allowed) {
    const isAdmin = await resolveIsAdminSession(supabase, user.id);
    if (isAdmin) redirect(`/${locale}/dashboard/admin/calendar`);
    redirect(`/${locale}/dashboard`);
  }

  const payload = await buildPortalCalendarPagePayload(supabase, user.id, "teacher");
  const origin = getPublicSiteUrl()?.origin ?? "";
  const feedUrl = payload.feedToken && origin ? `${origin}/api/calendar/feed/${payload.feedToken}.ics` : null;

  return (
    <PortalCalendarEntry
      locale={locale}
      dict={dict.dashboard.portalCalendar}
      events={payload.events}
      feedUrl={feedUrl}
      viewerId={user.id}
    />
  );
}
