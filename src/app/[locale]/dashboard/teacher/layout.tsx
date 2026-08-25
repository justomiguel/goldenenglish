import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBrandForRequest } from "@/lib/brand/server";
import { resolveTeacherPortalAccess } from "@/lib/academics/resolveTeacherPortalAccess";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { TeacherDashboardShell } from "@/components/dashboard/TeacherDashboardShell";
import { loadBlogEnabled } from "@/lib/blog/loadBlogEnabled";
import { formatProfileSnakeGivenFirst } from "@/lib/profile/formatProfileDisplayName";
import { adminUserRoleOptionLabel } from "@/lib/dashboard/adminUserRoleOptionLabel";
import { resolveAvatarDisplayUrl } from "@/lib/dashboard/resolveAvatarUrl";
import { getDashboardActor, syncViewAsCookie } from "@/lib/dashboard/getDashboardActor";
import { viewAsPortalRedirect } from "@/lib/dashboard/viewAsLayout";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function TeacherDashboardLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const brand = await getBrandForRequest();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/teacher`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, first_name, last_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  const actor = await getDashboardActor();
  if (actor) await syncViewAsCookie(actor);

  if (!actor?.viewAs && profile?.role === "assistant") {
    redirect(`/${locale}/dashboard/assistant`);
  }

  const { allowed } = await resolveTeacherPortalAccess(supabase, user.id);
  const [isAdmin, blogEnabled] = await Promise.all([
    resolveIsAdminSession(supabase, user.id),
    loadBlogEnabled(),
  ]);
  const redirectTo = actor
    ? viewAsPortalRedirect(locale, actor, "teacher", {
        sessionProfileRole: profile?.role ?? null,
        teacherPortalAllowed: allowed,
        assistantPortalAllowed: false,
      })
    : `/${locale}/dashboard`;
  if (redirectTo) redirect(redirectTo);
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

  const profileDisplayName = actor?.viewAs?.displayName
    ?? formatProfileSnakeGivenFirst(
    {
      first_name: profile?.first_name,
      last_name: profile?.last_name,
    },
    "",
  );
  const profileRoleLabel = adminUserRoleOptionLabel(
    dict.admin.users,
    actor?.viewAs?.role ?? profile?.role ?? "teacher",
  );
  const profileAvatarUrl = await resolveAvatarDisplayUrl(supabase, profile?.avatar_url);

  return (
    <TeacherDashboardShell
      locale={locale}
      dict={dict}
      brand={brand}
      adminNav={adminNav}
      includeBlogNav={blogEnabled}
      profileDisplayName={profileDisplayName}
      profileRoleLabel={profileRoleLabel}
      profileAvatarUrl={profileAvatarUrl}
      viewAs={actor?.viewAs ?? null}
    >
      {children}
    </TeacherDashboardShell>
  );
}
