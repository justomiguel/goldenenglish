import type { Dictionary } from "@/types/i18n";
import type {
  PortalAccountItem,
  PortalDestination,
  PortalShellConfig,
} from "@/lib/portal/portalShellTypes";

export interface BuildStudentShellConfigInput {
  locale: string;
  baseHref: string;
  dict: Dictionary;
  includePayments: boolean;
}

/**
 * The same four-destination shape as the parent portal, in the student's own words.
 * Students have no wards to switch between, so there are never subject chips, and no
 * guided-tour system yet, so no anchors.
 */
export function buildStudentShellConfig(
  input: BuildStudentShellConfigInput,
): PortalShellConfig {
  const { locale, baseHref, dict, includePayments } = input;
  const nav = dict.dashboard.studentNav;
  const chrome = dict.dashboard.studentChrome;
  const portal = dict.dashboard.portal;

  const destinations: PortalDestination[] = [
    { id: "home", href: baseHref, label: nav.home, icon: "home" },
    {
      id: "course",
      href: `${baseHref}/progress`,
      label: nav.course,
      icon: "progress",
      matchPrefixes: [
        `${baseHref}/calendar`,
        `${baseHref}/tasks`,
        `${baseHref}/assessments`,
        `${baseHref}/badges`,
      ],
    },
  ];

  if (includePayments) {
    destinations.push({
      id: "payments",
      href: `${baseHref}/payments`,
      label: nav.payments,
      icon: "payments",
      matchPrefixes: [`${baseHref}/billing`],
    });
  }

  destinations.push({
    id: "messages",
    href: `${baseHref}/messages`,
    label: nav.messages,
    icon: "messages",
  });

  const accountItems: PortalAccountItem[] = [
    { id: "profile", label: nav.myProfile, href: `/${locale}/dashboard/profile` },
    { id: "settings", label: nav.settings, href: `${baseHref}/settings` },
    { id: "language", label: portal.accountLanguage, action: "language" },
    { id: "installApp", label: portal.accountInstall, action: "installApp" },
    { id: "signOut", label: dict.nav.logout, action: "signOut" },
  ];

  return {
    baseHref,
    brandBadge: chrome.badge,
    ariaHeader: chrome.ariaHeader,
    ariaTabBar: portal.tabBarAria,
    ariaTopNav: portal.topNavAria,
    accountOpenLabel: portal.accountOpen,
    accountHeading: portal.accountHeading,
    accountCloseLabel: portal.accountClose,
    destinations,
    accountItems,
    subjectGroups: [],
    tourAnchors: {},
  };
}
