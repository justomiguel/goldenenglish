import { Suspense, type ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { AdminChromeHeader } from "@/components/dashboard/AdminChromeHeader";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { AdminMobileDrawer } from "@/components/dashboard/AdminMobileDrawer";
import { AdminInstituteTrail } from "@/components/dashboard/AdminInstituteTrail";
import { ViewAsEndedNotice } from "@/components/dashboard/ViewAsEndedNotice";
import { AdminEmailSendFailureBanner } from "@/components/dashboard/AdminEmailSendFailureBanner";
import { AdminStackableTableLabels } from "@/components/dashboard/AdminStackableTableLabels";
import { AdminMainScrollArea } from "@/components/dashboard/AdminMainScrollArea";
import { AdminMobileShellProvider } from "@/components/dashboard/AdminMobileShellContext";
import { AdminPwaTabBar } from "@/components/dashboard/AdminPwaTabBar";

interface AdminDashboardShellProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  newRegistrationsCount: number;
  recentInboundMessagesCount: number;
  adminProfileRole: string;
  teacherPortalAllowed: boolean;
  /** Mega-admin only: show Communications → Email templates in nav. */
  includeEmailTemplatesNav?: boolean;
  /** When true, show Blog in admin sidebar (`blog_enabled`). */
  includeBlogNav?: boolean;
  /** When true, show Merch in admin sidebar (`merch_enabled`). */
  includeMerchNav?: boolean;
  /** When true, sidebar/breadcrumb hidden (initial site setup wizard). */
  siteSetupRequired?: boolean;
  profileDisplayName?: string;
  profileRoleLabel?: string;
  profileAvatarUrl?: string | null;
  /** Last outbound email failed — show webmaster banner. */
  emailSendFailure?: boolean;
  children: ReactNode;
}

export function AdminDashboardShell({
  locale,
  dict,
  brand,
  newRegistrationsCount,
  recentInboundMessagesCount,
  adminProfileRole,
  teacherPortalAllowed,
  includeEmailTemplatesNav = false,
  includeBlogNav = false,
  includeMerchNav = false,
  siteSetupRequired = false,
  profileDisplayName = "",
  profileRoleLabel = "",
  profileAvatarUrl = null,
  emailSendFailure = false,
  children,
}: AdminDashboardShellProps) {
  const navDict = dict.dashboard.adminNav;

  return (
    <AdminMobileShellProvider>
    <div className="flex h-dvh max-h-dvh overflow-hidden bg-[var(--color-muted)]">
      {siteSetupRequired ? null : (
        <AdminSidebar
          locale={locale}
          dict={navDict}
          fullDict={dict}
          brand={brand}
          newRegistrationsCount={newRegistrationsCount}
          recentInboundMessagesCount={recentInboundMessagesCount}
          includeEmailTemplatesNav={includeEmailTemplatesNav}
          includeBlogNav={includeBlogNav}
          includeMerchNav={includeMerchNav}
          profileDisplayName={profileDisplayName}
          profileRoleLabel={profileRoleLabel}
          profileAvatarUrl={profileAvatarUrl}
        />
      )}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AdminChromeHeader
          locale={locale}
          brand={brand}
          dict={dict}
          adminProfileRole={adminProfileRole}
          teacherPortalAllowed={siteSetupRequired ? false : teacherPortalAllowed}
          compactBrand
          newRegistrationsCount={newRegistrationsCount}
          recentInboundMessagesCount={recentInboundMessagesCount}
          mobileNav={
            siteSetupRequired ? undefined : (
              <AdminMobileDrawer
                locale={locale}
                dict={dict}
                brand={brand}
                newRegistrationsCount={newRegistrationsCount}
                recentInboundMessagesCount={recentInboundMessagesCount}
                includeEmailTemplatesNav={includeEmailTemplatesNav}
                includeBlogNav={includeBlogNav}
                includeMerchNav={includeMerchNav}
                profileDisplayName={profileDisplayName}
                profileRoleLabel={profileRoleLabel}
                profileAvatarUrl={profileAvatarUrl}
              />
            )
          }
        />
        <div
          data-admin-main
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-3 pt-2.5 pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:px-8 md:py-5"
        >
          <AdminMainScrollArea copy={dict.pwa.pullToRefresh}>
            {siteSetupRequired ? null : (
              <AdminInstituteTrail locale={locale} dict={navDict} />
            )}
            <Suspense fallback={null}>
              <ViewAsEndedNotice dict={dict} />
            </Suspense>
            {emailSendFailure && !siteSetupRequired ? (
              <AdminEmailSendFailureBanner locale={locale} labels={dict.admin.settings} />
            ) : null}
            {children}
            <AdminStackableTableLabels />
          </AdminMainScrollArea>
        </div>
      </div>
      {siteSetupRequired ? null : (
        <AdminPwaTabBar
          locale={locale}
          dict={navDict}
          newRegistrationsCount={newRegistrationsCount}
          recentInboundMessagesCount={recentInboundMessagesCount}
        />
      )}
    </div>
    </AdminMobileShellProvider>
  );
}
