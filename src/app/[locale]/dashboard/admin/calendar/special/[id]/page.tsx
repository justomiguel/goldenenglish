import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { specialEventEditInitialFromRow } from "@/lib/calendar/specialEventEditInitial";
import { loadAdminSpecialEventScopeOptions } from "@/lib/calendar/loadAdminSpecialEventScopeOptions";
import { PortalSpecialEventEditForm } from "@/components/organisms/PortalSpecialEventEditForm";
import type { PortalSpecialCalendarEventRow } from "@/lib/calendar/portalSpecialCalendarEventRow";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: dict.dashboard.portalCalendar.specialEdit.title,
    robots: { index: false, follow: false },
  };
}

export default async function AdminSpecialCalendarEventEditPage({ params }: PageProps) {
  const { locale, id } = await params;
  const dict = await getDictionary(locale);
  const d = dict.dashboard.portalCalendar;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/admin/calendar/special/${id}`);

  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (!isAdmin) redirect(`/${locale}/dashboard`);

  const { data: row, error } = await supabase
    .from("portal_special_calendar_events")
    .select("id, title, notes, starts_at, ends_at, all_day, event_type, calendar_scope, cohort_id, section_id, meeting_url")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    logSupabaseClientError("adminSpecialCalendarEdit:select", error, { id });
    notFound();
  }
  if (!row) notFound();

  const initial = specialEventEditInitialFromRow(row as PortalSpecialCalendarEventRow);

  const scopeOptions = await loadAdminSpecialEventScopeOptions(supabase);

  return (
    <div className="mx-auto max-w-[var(--layout-max-width)] space-y-6 px-3 py-8 md:px-6">
      <Link
        href={`/${locale}/dashboard/admin/calendar/special`}
        className="text-sm font-medium text-[var(--color-primary)] underline underline-offset-2"
      >
        {d.specialEdit.backToList}
      </Link>
      <h1 className="font-display text-2xl font-bold text-[var(--color-secondary)]">{d.specialEdit.title}</h1>
      <PortalSpecialEventEditForm
        locale={locale}
        eventId={id}
        dict={d.specialAdmin}
        editDict={d.specialEdit}
        scopeOptions={scopeOptions}
        initial={initial}
      />
    </div>
  );
}
