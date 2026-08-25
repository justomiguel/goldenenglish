import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { redirect } from "next/navigation";
import { loadAdminHubSummary } from "@/lib/dashboard/loadAdminHubSummary";
import { loadAdminFirstClassChecklist } from "@/lib/dashboard/loadAdminFirstClassChecklist";
import { loadDashboardBirthdaysCard } from "@/lib/birthdays/loadDashboardBirthdaysCard";
import { AdminHubHome } from "@/components/dashboard/AdminHubHome";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";

interface AdminHomeProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: AdminHomeProps) {
  const { locale } = await params;
  return buildPageMetadata(locale, (d) => d.admin.home.title);
}

export default async function AdminHomePage({ params }: AdminHomeProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/admin`);

  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (!isAdmin) redirect(`/${locale}`);

  const adminClient = createAdminClient();
  const [summary, birthdayRows, checklist] = await Promise.all([
    loadAdminHubSummary(supabase, adminClient, user.id),
    loadDashboardBirthdaysCard(supabase, user.id),
    loadAdminFirstClassChecklist(supabase, locale),
  ]);

  return (
    <AdminHubHome
      locale={locale}
      dict={dict}
      summary={summary}
      birthdayRows={birthdayRows}
      birthdaysDict={dict.dashboard.birthdays}
      checklist={checklist}
    />
  );
}
