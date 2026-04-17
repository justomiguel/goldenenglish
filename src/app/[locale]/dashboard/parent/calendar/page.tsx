import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
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

export default async function ParentCalendarPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/parent/calendar`);

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "parent") redirect(`/${locale}/dashboard`);

  const payload = await buildPortalCalendarPagePayload(supabase, user.id, "parent");
  const origin = getPublicSiteUrl()?.origin ?? "";
  const feedUrl = payload.feedToken && origin ? `${origin}/api/calendar/feed/${payload.feedToken}.ics` : null;

  return (
    <PortalCalendarEntry locale={locale} dict={dict.dashboard.portalCalendar} events={payload.events} feedUrl={feedUrl} />
  );
}
