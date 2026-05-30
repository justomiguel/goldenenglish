import Link from "next/link";
import type { ReactNode } from "react";
import {
  BarChart3,
  Inbox,
  Settings,
  TrendingUp,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";
import type { Dictionary } from "@/types/i18n";

export type FinanceHubTabId =
  | "collections"
  | "inbox"
  | "events"
  | "insights"
  | "settings";

export const FINANCE_HUB_TAB_ORDER: readonly FinanceHubTabId[] = [
  "collections",
  "inbox",
  "events",
  "insights",
  "settings",
];

export const DEFAULT_FINANCE_HUB_TAB: FinanceHubTabId = "collections";

/** Legacy URLs used `tab=overview`; same hub view is now default `collections`. */
const LEGACY_TAB_ALIASES: Readonly<Record<string, FinanceHubTabId>> = {
  overview: "collections",
};

export function parseFinanceHubTab(raw: string | undefined): FinanceHubTabId {
  if (!raw) return DEFAULT_FINANCE_HUB_TAB;
  const alias = LEGACY_TAB_ALIASES[raw];
  if (alias) return alias;
  return (FINANCE_HUB_TAB_ORDER as readonly string[]).includes(raw)
    ? (raw as FinanceHubTabId)
    : DEFAULT_FINANCE_HUB_TAB;
}

type HubDict = Dictionary["admin"]["finance"]["hub"];

const TAB_ICONS: Record<FinanceHubTabId, LucideIcon> = {
  collections: BarChart3,
  inbox: Inbox,
  events: CalendarDays,
  insights: TrendingUp,
  settings: Settings,
};

function tooltipFor(tab: FinanceHubTabId, dict: HubDict): string {
  switch (tab) {
    case "collections":
      return dict.tipCollections;
    case "inbox":
      return dict.tipInbox;
    case "events":
      return dict.tipEvents;
    case "insights":
      return dict.tipInsights;
    case "settings":
      return dict.tipSettings;
  }
}

function pendingBadgeFor(
  tab: FinanceHubTabId,
  counts: FinanceHubPendingCounts | undefined,
): number {
  if (!counts) return 0;
  if (tab === "inbox") return counts.payments ?? 0;
  if (tab === "events") return counts.receipts ?? 0;
  return 0;
}

export interface FinanceHubPendingCounts {
  receipts?: number;
  payments?: number;
}

export interface FinanceHubTabsProps {
  current: FinanceHubTabId;
  baseHref: string;
  preservedQuery?: Readonly<Record<string, string | undefined>>;
  pendingCounts?: FinanceHubPendingCounts;
  cohortSelector?: ReactNode;
  kpiStrip?: ReactNode;
  dict: HubDict;
  children: ReactNode;
}

function buildHref(
  baseHref: string,
  tab: FinanceHubTabId,
  preserved: Readonly<Record<string, string | undefined>> | undefined,
): string {
  const params = new URLSearchParams();
  params.set("tab", tab);
  if (preserved) {
    for (const [k, v] of Object.entries(preserved)) {
      if (v != null && v !== "" && k !== "tab") params.set(k, v);
    }
  }
  return `${baseHref}?${params.toString()}`;
}

function tabClasses(isActive: boolean): string {
  const base =
    "group relative inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium outline-offset-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] sm:px-4 sm:py-3";
  if (isActive) {
    return `${base} border-[var(--color-primary)] bg-[var(--color-primary)]/8 text-[var(--color-primary)]`;
  }
  return `${base} border-transparent text-[var(--color-foreground)]/70 hover:border-[var(--color-border)] hover:bg-[var(--color-muted)]/40 hover:text-[var(--color-foreground)]`;
}

function badgeClasses(isActive: boolean): string {
  const base =
    "ms-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums";
  return isActive
    ? `${base} bg-[var(--color-primary)] text-[var(--color-primary-foreground)]`
    : `${base} bg-[var(--color-error)]/10 text-[var(--color-error)]`;
}

export function FinanceHubTabs({
  current,
  baseHref,
  preservedQuery,
  pendingCounts,
  cohortSelector,
  kpiStrip,
  dict,
  children,
}: FinanceHubTabsProps) {
  return (
    <div className="space-y-4">
      {cohortSelector}
      {kpiStrip}
      <div className="overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <nav
          aria-label={dict.title}
          className="flex w-full overflow-x-auto border-b border-[var(--color-border)]"
        >
          {FINANCE_HUB_TAB_ORDER.map((tab) => {
            const Icon = TAB_ICONS[tab];
            const isActive = tab === current;
            const href = buildHref(baseHref, tab, preservedQuery);
            const badge = pendingBadgeFor(tab, pendingCounts);
            return (
              <Link
                key={tab}
                href={href}
                title={tooltipFor(tab, dict)}
                aria-label={dict.tabs[tab]}
                aria-current={isActive ? "page" : undefined}
                className={tabClasses(isActive)}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 transition ${
                    isActive
                      ? "opacity-100"
                      : "opacity-70 group-hover:opacity-100"
                  }`}
                  aria-hidden
                />
                <span>{dict.tabs[tab]}</span>
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
          {tooltipFor(current, dict)}
        </p>
      </div>
      <div>{children}</div>
    </div>
  );
}
