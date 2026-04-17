import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBrandPublic } from "@/lib/brand/server";
import { resolveTeacherPortalAccess } from "@/lib/academics/resolveTeacherPortalAccess";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { TeacherDashboardShell } from "@/components/dashboard/TeacherDashboardShell";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function TeacherDashboardLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const brand = getBrandPublic();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/teacher`);

  const { allowed } = await resolveTeacherPortalAccess(supabase, user.id);
  if (!allowed) redirect(`/${locale}/dashboard`);

  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  const navDict = dict.dashboard.teacherNav;
  const chromeDict = dict.dashboard.teacherChrome;
  const adminNav = isAdmin
    ? {
        href: `/${locale}/dashboard/admin`,
        hint: chromeDict.dualRoleAdminNavHint,
        cta: chromeDict.openAdminDashboard,
        ctaAria: chromeDict.openAdminDashboardAria,
        switchHint: navDict.workspaceSwitchHint,
      }
    : undefined;

  return (
    <TeacherDashboardShell locale={locale} dict={dict} brand={brand} adminNav={adminNav}>
      {children}
    </TeacherDashboardShell>
  );
}
