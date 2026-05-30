import Link from "next/link";
import type { ReactNode } from "react";
import {
  Bell,
  ClipboardList,
  CreditCard,
  Hourglass,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from "lucide-react";

export type EventAdminTab =
  | "summary"
  | "form"
  | "attendees"
  | "payments"
  | "waitlist"
  | "notifications";

export const EVENT_ADMIN_TAB_ORDER: readonly EventAdminTab[] = [
  "summary",
  "form",
  "attendees",
  "payments",
  "waitlist",
  "notifications",
];

export const DEFAULT_EVENT_ADMIN_TAB: EventAdminTab = "summary";

export function parseEventAdminTab(raw: string | undefined): EventAdminTab {
  if (!raw) return DEFAULT_EVENT_ADMIN_TAB;
  return (EVENT_ADMIN_TAB_ORDER as readonly string[]).includes(raw)
    ? (raw as EventAdminTab)
    : DEFAULT_EVENT_ADMIN_TAB;
}

export interface AdminEventDetailTabLabels {
  tabsAria: string;
  tabs: Record<EventAdminTab, string>;
  tabLeads: Record<EventAdminTab, string>;
}

export interface AdminEventDetailTabCounts {
  attendees?: number;
  payments?: number;
}

export interface AdminEventDetailTabsProps {
  current: EventAdminTab;
  baseHref: string;
  labels: AdminEventDetailTabLabels;
  counts?: AdminEventDetailTabCounts;
  children: ReactNode;
}

const TAB_ICONS: Record<EventAdminTab, LucideIcon> = {
  summary: LayoutDashboard,
  form: ClipboardList,
  attendees: Users,
  payments: CreditCard,
  waitlist: Hourglass,
  notifications: Bell,
};

function buildHref(baseHref: string, tab: EventAdminTab): string {
  const params = new URLSearchParams();
  params.set("tab", tab);
  return `${baseHref}?${params.toString()}`;
}

function tabClasses(isActive: boolean): string {
  const base =
    "group relative inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium outline-offset-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] sm:px-4 sm:py-3 min-h-[44px]";
  if (isActive) {
    return `${base} border-[var(--color-primary)] bg-[var(--color-primary)]/8 text-[var(--color-primary)]`;
  }
  return `${base} border-transparent text-[var(--color-foreground)]/70 hover:border-[var(--color-border)] hover:bg-[var(--color-muted)]/40 hover:text-[var(--color-foreground)]`;
}

function countBadgeFor(
  tab: EventAdminTab,
  counts: AdminEventDetailTabCounts | undefined,
): number {
  if (!counts) return 0;
  if (tab === "attendees") return counts.attendees ?? 0;
  if (tab === "payments") return counts.payments ?? 0;
  return 0;
}

function badgeClasses(isActive: boolean): string {
  const base =
    "ms-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums";
  return isActive
    ? `${base} bg-[var(--color-primary)] text-[var(--color-primary-foreground)]`
    : `${base} bg-[var(--color-muted)] text-[var(--color-muted-foreground)]`;
}

export function AdminEventDetailTabs({
  current,
  baseHref,
  labels,
  counts,
  children,
}: AdminEventDetailTabsProps) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <nav
          aria-label={labels.tabsAria}
          className="flex w-full overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-muted)]/15"
        >
          {EVENT_ADMIN_TAB_ORDER.map((tab) => {
            const Icon = TAB_ICONS[tab];
            const isActive = tab === current;
            const href = buildHref(baseHref, tab);
            const badge = countBadgeFor(tab, counts);
            return (
              <Link
                key={tab}
                href={href}
                title={labels.tabLeads[tab]}
                aria-label={labels.tabs[tab]}
                aria-current={isActive ? "page" : undefined}
                className={tabClasses(isActive)}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition ${
                    isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                  }`}
                  aria-hidden
                />
                <span>{labels.tabs[tab]}</span>
                {badge > 0 ? (
                  <span aria-hidden className={badgeClasses(isActive)}>
                    {badge > 99 ? "99+" : badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <p className="px-4 py-2.5 text-xs leading-snug text-[var(--color-muted-foreground)] sm:px-5">
          {labels.tabLeads[current]}
        </p>
      </div>
      <div>{children}</div>
    </div>
  );
}
