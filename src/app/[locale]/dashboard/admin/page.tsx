import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { redirect } from "next/navigation";
import { loadAdminHubSummary } from "@/lib/dashboard/loadAdminHubSummary";
import { AdminHubHome } from "@/components/dashboard/AdminHubHome";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface AdminHomeProps {
  params: Promise<{ locale: string }>;
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
  const summary = await loadAdminHubSummary(supabase, adminClient, user.id);

  return <AdminHubHome locale={locale} dict={dict} summary={summary} />;
}
