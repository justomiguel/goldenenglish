import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBrandForRequest } from "@/lib/brand/server";
import { ParentDashboardShell } from "@/components/dashboard/ParentDashboardShell";
import { ParentHelpLauncher } from "@/components/dashboard/ParentHelpLauncher";
import { loadParentChildrenSummaries } from "@/lib/parent/loadParentChildrenSummaries";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function ParentDashboardLayout({
  children,
  params,
}: LayoutProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const brand = await getBrandForRequest();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/parent`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "parent") redirect(`/${locale}/dashboard`);

  const summaries = await loadParentChildrenSummaries(supabase, user.id);
  const defaultStudentId = summaries[0]?.studentId;

  return (
    <ParentDashboardShell locale={locale} dict={dict} brand={brand}>
      <ParentHelpLauncher
        locale={locale}
        launcherDict={dict.dashboard.parentHelpLauncher}
        catalogDict={dict.dashboard.parentHelpCatalog}
        toursDict={dict.dashboard.parentHelpTours}
        explainScreenDict={dict.dashboard.parentHelpExplainScreen}
        screenToursDict={dict.dashboard.parentHelpScreenTours}
        defaultStudentId={defaultStudentId}
      />
      {children}
    </ParentDashboardShell>
  );
}
