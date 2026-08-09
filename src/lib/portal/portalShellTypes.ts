export type PortalIconName = "home" | "calendar" | "progress" | "payments" | "messages";

export interface PortalDestination {
  id: string;
  href: string;
  label: string;
  icon: PortalIconName;
  /** Extra path prefixes that should light up this destination. */
  matchPrefixes?: string[];
}

export type PortalAccountAction = "signOut" | "language" | "installApp";

export interface PortalAccountItem {
  id: string;
  label: string;
  meta?: string;
  href?: string;
  action?: PortalAccountAction;
}

export interface PortalSubjectOption {
  id: string;
  label: string;
}

export interface PortalSubjectGroup {
  /** URL search param this group writes to. */
  param: "studentId" | "sectionId";
  label: string;
  options: PortalSubjectOption[];
  activeId: string;
}

/** Stable Driver.js anchors; each portal supplies its own ids. */
export interface PortalTourAnchors {
  header?: string;
  topNav?: string;
  tabBar?: string;
  account?: string;
  signOut?: string;
  subjectChips?: string;
}

export interface PortalShellConfig {
  baseHref: string;
  brandBadge: string;
  ariaHeader: string;
  ariaTabBar: string;
  ariaTopNav: string;
  accountOpenLabel: string;
  accountHeading: string;
  accountCloseLabel: string;
  destinations: PortalDestination[];
  accountItems: PortalAccountItem[];
  /** Rendered only for groups with more than one option; empty is the common case. */
  subjectGroups: PortalSubjectGroup[];
  tourAnchors: PortalTourAnchors;
}
