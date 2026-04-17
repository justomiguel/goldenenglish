import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { loadAdminSpecialEventScopeOptions } from "@/lib/calendar/loadAdminSpecialEventScopeOptions";
import { PortalSpecialEventCreateForm } from "@/components/organisms/PortalSpecialEventCreateForm";
import { PortalSpecialEventsTable, type SpecialEventListRow } from "@/components/organisms/PortalSpecialEventsTable";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.portalCalendar.specialAdmin.title,
    robots: { index: false, follow: false },
  };
}

export default async function AdminSpecialCalendarEventsPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const d = dict.dashboard.portalCalendar;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/admin/calendar/special`);

  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (!isAdmin) redirect(`/${locale}/dashboard`);

  const { data: rows, error } = await supabase
    .from("portal_special_calendar_events")
    .select("id, title, starts_at, ends_at, all_day, event_type")
    .order("starts_at", { ascending: false })
    .limit(150);
  if (error) {
    logSupabaseClientError("adminSpecialCalendarPage:list", error, {});
  }

  const scopeOptions = await loadAdminSpecialEventScopeOptions(supabase);

  return (
    <div className="mx-auto max-w-[var(--layout-max-width)] space-y-6 px-3 py-8 md:px-6">
      <Link
        href={`/${locale}/dashboard/admin/calendar`}
        className="text-sm font-medium text-[var(--color-primary)] underline underline-offset-2"
      >
        {d.specialAdmin.backToCalendar}
      </Link>
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-secondary)]">{d.specialAdmin.title}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{d.specialAdmin.lead}</p>
      </div>
      <PortalSpecialEventCreateForm locale={locale} dict={d.specialAdmin} scopeOptions={scopeOptions} />
      <div>
        <h2 className="mb-2 text-base font-semibold text-[var(--color-primary)]">{d.specialAdmin.tableTitle}</h2>
        <PortalSpecialEventsTable locale={locale} dict={d.specialAdmin} rows={(rows ?? []) as SpecialEventListRow[]} />
      </div>
    </div>
  );
}
