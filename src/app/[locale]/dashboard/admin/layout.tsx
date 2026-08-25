import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBrandForRequest } from "@/lib/brand/server";
import { neutralBrandForGreenfield } from "@/lib/brand/neutralBrandForGreenfield";
import { resolveIsAdminSession } from "@/lib/auth/resolveIsAdminSession";
import { resolveTeacherPortalAccess } from "@/lib/academics/resolveTeacherPortalAccess";
import { AdminDashboardShell } from "@/components/dashboard/AdminDashboardShell";
import { AdminCommandPalette } from "@/components/dashboard/AdminCommandPalette";
import { AdminHelpLauncher } from "@/components/dashboard/AdminHelpLauncher";
import { AdminTutorialMissingCohortHost } from "@/components/dashboard/AdminTutorialMissingCohortHost";
import { loadNeedsInitialSiteSetup } from "@/lib/site/loadNeedsInitialSiteSetup";
import { AdminInitialSiteSetupGate } from "@/components/dashboard/admin/site-setup/AdminInitialSiteSetupGate";
import { isEmailTemplatesMegaAdmin } from "@/lib/auth/emailTemplatesMegaAdmin";
import { loadAdminRecentInboundMessageCount } from "@/lib/dashboard/loadAdminRecentInboundMessageCount";
import { loadBlogEnabled } from "@/lib/blog/loadBlogEnabled";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { formatProfileSnakeGivenFirst } from "@/lib/profile/formatProfileDisplayName";
import { adminUserRoleOptionLabel } from "@/lib/dashboard/adminUserRoleOptionLabel";
import { resolveAvatarDisplayUrl } from "@/lib/dashboard/resolveAvatarUrl";

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminSectionLayout({
  children,
  params,
}: AdminLayoutProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/login?next=/${locale}/dashboard/admin`);
  }

  const isAdmin = await resolveIsAdminSession(supabase, user.id);
  if (!isAdmin) {
    redirect(`/${locale}`);
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role, first_name, last_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  const adminProfileRole = adminProfile?.role ?? "unknown";
  const profileDisplayName = formatProfileSnakeGivenFirst(
    {
      first_name: adminProfile?.first_name,
      last_name: adminProfile?.last_name,
    },
    "",
  );
  const profileRoleLabel = adminUserRoleOptionLabel(dict.admin.users, adminProfileRole);
  const profileAvatarUrl = await resolveAvatarDisplayUrl(supabase, adminProfile?.avatar_url);

  const { allowed: teacherPortalAllowed } = await resolveTeacherPortalAccess(supabase, user.id);

  const [registrationsResult, recentInboundMessagesCount] = await Promise.all([
    supabase
      .from("registrations")
      .select("id", { head: true, count: "exact" })
      .eq("status", "new"),
    loadAdminRecentInboundMessageCount(supabase, user.id),
  ]);
  const newRegistrationsCount = registrationsResult.count ?? 0;
  if (registrationsResult.error) {
    logSupabaseClientError("adminLayout.registrationsNewCount", registrationsResult.error, {});
  }

  const [needsInitialSiteSetup, blogEnabled] = await Promise.all([
    loadNeedsInitialSiteSetup(supabase),
    loadBlogEnabled(),
  ]);

  const brand = needsInitialSiteSetup
    ? neutralBrandForGreenfield(dict)
    : await getBrandForRequest();

  return (
    <AdminDashboardShell
      locale={locale}
      dict={dict}
      brand={brand}
      newRegistrationsCount={newRegistrationsCount}
      recentInboundMessagesCount={recentInboundMessagesCount}
      adminProfileRole={adminProfileRole}
      teacherPortalAllowed={teacherPortalAllowed}
      includeEmailTemplatesNav={isEmailTemplatesMegaAdmin(user.email)}
      includeBlogNav={blogEnabled && !needsInitialSiteSetup}
      siteSetupRequired={needsInitialSiteSetup}
      profileDisplayName={profileDisplayName}
      profileRoleLabel={profileRoleLabel}
      profileAvatarUrl={profileAvatarUrl}
    >
      <AdminInitialSiteSetupGate
        locale={locale}
        needsSetup={needsInitialSiteSetup}
        redirectLabel={dict.dashboard.siteSetup.gateRedirect}
      >
        {needsInitialSiteSetup ? null : (
          <>
            <AdminCommandPalette locale={locale} dict={dict.dashboard.adminCommandPalette} />
            <AdminHelpLauncher
              locale={locale}
              launcherDict={dict.dashboard.adminHelpLauncher}
              catalogDict={dict.dashboard.adminHelpCatalog}
              catalogGroupsDict={dict.dashboard.adminHelpCatalogGroups}
              toursDict={dict.dashboard.adminHelpTours}
              explainScreenDict={dict.dashboard.adminHelpExplainScreen}
              screenToursDict={dict.dashboard.adminHelpScreenTours}
            />
            <AdminTutorialMissingCohortHost />
          </>
        )}
        {children}
      </AdminInitialSiteSetupGate>
    </AdminDashboardShell>
  );
}
