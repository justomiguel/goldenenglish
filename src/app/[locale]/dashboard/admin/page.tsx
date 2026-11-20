import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { redirect } from "next/navigation";
import { loadAdminHubSummary } from "@/lib/dashboard/loadAdminHubSummary";
import { loadAdminFirstClassChecklist } from "@/lib/dashboard/loadAdminFirstClassChecklist";
import { loadDashboardBirthdaysCard } from "@/lib/birthdays/loadDashboardBirthdaysCard";
import { AdminHubHome } from "@/components/dashboard/AdminHubHome";
import { loadBlogEnabled } from "@/lib/blog/loadBlogEnabled";
import { loadAdminHomeLayout } from "@/lib/dashboard/loadAdminHomeLayout";
import { loadAdminHomeExtraWidgets } from "@/lib/dashboard/loadAdminHomeExtraWidgets";
import { loadMerchEnabled } from "@/lib/shop/loadMerchEnabled";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";
import { buildPageMetadata } from "@/lib/metadata/buildPageMetadata";
import { FaqHomeCard } from "@/variants/owned/mozarthitos/pieces/FaqHomeCard";
import { loadMozarthitosFaqHomeCard } from "@/variants/owned/mozarthitos/pieces/loadFaqHomeCard";

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

  const adminClient = await createAdminClient();
  const [summary, birthdayRows, profile, includeBlog, checklist, shopEnabled, activeTheme] =
    await Promise.all([
      loadAdminHubSummary(supabase, adminClient, user.id),
      loadDashboardBirthdaysCard(supabase, user.id),
      supabase.from("profiles").select("first_name").eq("id", user.id).maybeSingle(),
      loadBlogEnabled(),
      loadAdminFirstClassChecklist(supabase, locale),
      loadMerchEnabled(),
      loadActiveTheme(),
    ]);
  const layout = await loadAdminHomeLayout(supabase, user.id, { shopEnabled });
  const extras = await loadAdminHomeExtraWidgets({
    supabase,
    admin: adminClient,
    layout,
    shopEnabled,
    locale,
  });
  const greetingName = String(profile.data?.first_name ?? "").trim();
  const faqHome = await loadMozarthitosFaqHomeCard(
    activeTheme?.theme.templateKind ?? null,
    () => supabase.rpc("faq_admin_stats_30d"),
    dict.publicAnswers.kinds.mozarthitos.items,
  );

  return (
    <AdminHubHome
      locale={locale}
      dict={dict}
      summary={summary}
      birthdayRows={birthdayRows}
      birthdaysDict={dict.dashboard.birthdays}
      greetingName={greetingName || undefined}
      includeBlog={includeBlog}
      checklist={checklist}
      layout={layout}
      shopEnabled={shopEnabled}
      extras={extras}
      faqHome={faqHome ? <FaqHomeCard locale={locale} dict={dict} model={faqHome} /> : null}
    />
  );
}
