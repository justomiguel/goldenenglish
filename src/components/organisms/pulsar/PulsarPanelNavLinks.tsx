import Link from "next/link";
import {
  BarChart3,
  Building2,
  Inbox,
  LayoutTemplate,
  Mail,
  Plus,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  isPulsarPanelItemActive,
  type PulsarPanelNavItem,
} from "@/lib/pulsar/pulsarPanelNav";

const ICONS: Record<string, LucideIcon> = {
  sites: Building2,
  accounts: Users,
  mail: Mail,
  messages: Inbox,
  analytics: BarChart3,
  templates: LayoutTemplate,
  new: Plus,
  profile: UserRound,
};

export function PulsarPanelNavLinks({
  label,
  items,
  pathname,
  tab,
}: {
  label: string;
  items: readonly PulsarPanelNavItem[];
  pathname: string;
  tab: string | null;
}) {
  return (
    <div className="pt-4">
      <p className="px-3 text-sm font-medium text-[var(--color-muted-foreground)]">{label}</p>
      <ul className="mt-1 space-y-1">
        {items.map((item) => {
          const Icon = ICONS[item.id] ?? Building2;
          const active = isPulsarPanelItemActive(item, pathname, tab);
          const create = item.id === "new";
          return (
            <li key={item.id} className={create ? "pt-2" : undefined}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  create
                    ? "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-3 text-sm font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)]"
                    : `inline-flex min-h-11 w-full items-center gap-2 rounded-[var(--layout-border-radius)] px-3 text-sm font-semibold transition-colors ${
                        active
                          ? "bg-[var(--color-muted)] text-[var(--color-foreground)]"
                          : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                      }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
