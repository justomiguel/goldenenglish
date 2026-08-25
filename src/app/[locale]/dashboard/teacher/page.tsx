import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { resolveTeacherPortalAccess } from "@/lib/academics/resolveTeacherPortalAccess";
import { loadTeacherDashboardModel } from "@/lib/teacher/loadTeacherDashboardModel";
import { loadDashboardBirthdaysCard } from "@/lib/birthdays/loadDashboardBirthdaysCard";
import { getDashboardActor } from "@/lib/dashboard/getDashboardActor";
import { TeacherDashboardHome } from "@/components/teacher/TeacherDashboardHome";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.dashboard.teacherNav.home);
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function TeacherDashboardPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/teacher`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, first_name")
    .eq("id", user.id)
    .maybeSingle();

  const actor = await getDashboardActor();
  const viewerId = actor?.viewerId ?? user.id;
  const { allowed } = await resolveTeacherPortalAccess(supabase, user.id);
  if (!allowed && !actor?.viewAs) redirect(`/${locale}/dashboard`);

  const model = await loadTeacherDashboardModel(supabase, viewerId);
  const firstName = actor?.viewAs?.displayName.split(" ")[0] ?? (profile?.first_name as string | null) ?? null;
  const birthdayRows = await loadDashboardBirthdaysCard(supabase, viewerId);

  return (
    <TeacherDashboardHome
      locale={locale}
      dict={dict}
      model={model}
      firstName={firstName}
      birthdayRows={birthdayRows}
      birthdaysDict={dict.dashboard.birthdays}
    />
  );
}
