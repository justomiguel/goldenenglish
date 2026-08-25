import type { ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { AssistantBreadcrumb } from "@/components/dashboard/AssistantBreadcrumb";
import { WorkplaceShell } from "@/components/dashboard/WorkplaceShell";
import type { WorkplaceNavGroup } from "@/lib/dashboard/workplaceNav";
import type { ViewAsSubject } from "@/lib/dashboard/viewAsTypes";
import { StaffWorkspaceSwitch } from "@/components/dashboard/StaffWorkspaceSwitch";
import { ViewAsBanner } from "@/components/dashboard/ViewAsBanner";

export interface AssistantDashboardShellProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  profileDisplayName?: string;
  profileAvatarUrl?: string | null;
  viewAs?: ViewAsSubject | null;
  children: ReactNode;
}

export function AssistantDashboardShell({
  locale,
  dict,
  brand,
  profileDisplayName = "",
  profileAvatarUrl = null,
  viewAs = null,
  children,
}: AssistantDashboardShellProps) {
  const navDict = dict.dashboard.assistantNav;
  const chrome = dict.dashboard.assistantChrome;
  const base = `/${locale}/dashboard/assistant`;
  const navGroups: WorkplaceNavGroup[] = [
    {
      label: navDict.groupWorkspace,
      items: [
        {
          href: base,
          label: navDict.home,
          iconId: "academic",
          tip: navDict.tipHome,
          matchPrefixes: [`${base}/sections`],
        },
      ],
    },
  ];

  return (
    <WorkplaceShell
      locale={locale}
      dict={dict}
      brand={brand}
      homeHref={base}
      roleBadge={chrome.badge}
      navAria={navDict.aria}
      mobileOpen={navDict.mobileOpen}
      mobileClose={navDict.mobileClose}
      backToSite={chrome.backToSite}
      signOutTitle={chrome.signOutHint}
      headerAria={chrome.ariaHeader}
      navGroups={navGroups}
      profileDisplayName={profileDisplayName}
      profileRoleLabel={chrome.badge}
      profileAvatarUrl={profileAvatarUrl}
      hideSignOut={Boolean(viewAs)}
      workspaceSwitch={
        viewAs ? (
          <StaffWorkspaceSwitch locale={locale} dict={dict} activeRole="assistant" viewAs={viewAs} />
        ) : null
      }
      viewAsBanner={viewAs ? <ViewAsBanner locale={locale} dict={dict} viewAs={viewAs} /> : null}
    >
      <AssistantBreadcrumb locale={locale} dict={navDict} />
      {children}
    </WorkplaceShell>
  );
}
