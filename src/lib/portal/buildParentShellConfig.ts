import type { Dictionary } from "@/types/i18n";
import type { ParentFocusCatalog } from "@/lib/parent/parentFocusTypes";
import type {
  PortalAccountItem,
  PortalDestination,
  PortalShellConfig,
  PortalSubjectGroup,
} from "@/lib/portal/portalShellTypes";
import { PARENT_TOUR_ANCHORS } from "@/lib/parent-tutorials/selectors";

export interface BuildParentShellConfigInput {
  locale: string;
  baseHref: string;
  dict: Dictionary;
  includePayments: boolean;
  focusCatalog: ParentFocusCatalog;
  activeStudentId: string | null;
  activeSectionId: string | null;
}

export function buildParentShellConfig(
  input: BuildParentShellConfigInput,
): PortalShellConfig {
  const { locale, baseHref, dict, includePayments, focusCatalog } = input;
  const nav = dict.dashboard.parentNav;
  const chrome = dict.dashboard.parentChrome;
  const portal = dict.dashboard.portal;

  // Four destinations: the two questions a parent opens the app with, plus the two
  // errands. Everything else is reachable from a card or from the account sheet.
  const destinations: PortalDestination[] = [
    { id: "home", href: baseHref, label: nav.home, icon: "home" },
    {
      id: "child",
      href: `${baseHref}/child`,
      label: dict.dashboard.parent.childScreen.navLabel,
      icon: "progress",
      // The agenda and every legacy address land here, so a redirected URL still
      // lights up the tab a parent expects.
      matchPrefixes: [
        `${baseHref}/calendar`,
        `${baseHref}/progress`,
        `${baseHref}/tasks`,
        `${baseHref}/assessments`,
        `${baseHref}/feedback`,
        `${baseHref}/badges`,
        `${baseHref}/children`,
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

  const students = focusCatalog.students;
  const activeStudent =
    students.find((student) => student.studentId === input.activeStudentId) ?? students[0] ?? null;
  const sections = activeStudent
    ? focusCatalog.sectionsByStudentId[activeStudent.studentId] ?? []
    : [];
  const activeSection =
    sections.find((section) => section.sectionId === input.activeSectionId) ?? sections[0] ?? null;

  const accountItems: PortalAccountItem[] = [
    { id: "profile", label: nav.myProfile, href: `/${locale}/dashboard/profile` },
  ];

  if (activeStudent) {
    accountItems.push({
      id: "childDetails",
      label: portal.accountChildDetails,
      meta: activeStudent.displayName,
      href: `${baseHref}/child/edit?studentId=${activeStudent.studentId}`,
    });
  }

  accountItems.push(
    { id: "language", label: portal.accountLanguage, action: "language" },
    // Installability is a client fact; the sheet drops this item when there is no prompt.
    { id: "installApp", label: portal.accountInstall, action: "installApp" },
    { id: "signOut", label: dict.nav.logout, action: "signOut" },
  );

  const subjectGroups: PortalSubjectGroup[] = [];

  if (students.length > 1) {
    subjectGroups.push({
      param: "studentId",
      label: portal.subjectChildLabel,
      options: students.map((student) => ({
        id: student.studentId,
        label: student.displayName,
      })),
      activeId: activeStudent?.studentId ?? students[0].studentId,
    });
  }

  if (sections.length > 1 && activeSection) {
    subjectGroups.push({
      param: "sectionId",
      label: portal.subjectSectionLabel,
      options: sections.map((section) => ({
        id: section.sectionId,
        label: section.classLabel,
      })),
      activeId: activeSection.sectionId,
    });
  }

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
    subjectGroups,
    tourAnchors: {
      header: PARENT_TOUR_ANCHORS.chromeHeader,
      topNav: PARENT_TOUR_ANCHORS.portalTopNav,
      tabBar: PARENT_TOUR_ANCHORS.tabBar,
      account: PARENT_TOUR_ANCHORS.portalAccount,
      signOut: PARENT_TOUR_ANCHORS.chromeSignOut,
      subjectChips: PARENT_TOUR_ANCHORS.portalSubjectChips,
    },
  };
}
