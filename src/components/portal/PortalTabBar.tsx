"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { PortalDestination } from "@/lib/portal/portalShellTypes";
import { resolveActiveDestination } from "@/lib/portal/resolveActiveDestination";
import { withParentFocusHref } from "@/lib/parent/withParentFocusHref";
import { PortalIcon } from "@/components/portal/PortalIcon";

export interface PortalTabBarProps {
  destinations: PortalDestination[];
  ariaLabel: string;
  tourAnchor?: string;
}

export function PortalTabBar({ destinations, ariaLabel, tourAnchor }: PortalTabBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId");
  const sectionId = searchParams.get("sectionId");
  const activeId = resolveActiveDestination(pathname, destinations);

  return (
    <nav
      aria-label={ariaLabel}
      {...(tourAnchor ? { "data-tour": tourAnchor } : {})}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }}
    >
      <ul className="mx-auto flex max-w-[var(--layout-max-width)] items-stretch justify-around px-1 pt-1">
        {destinations.map((destination) => {
          const isActive = destination.id === activeId;
          return (
            <li key={destination.id} className="min-w-0 flex-1">
              <Link
                href={withParentFocusHref(destination.href, { studentId, sectionId })}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-[var(--layout-border-radius)] px-1 py-1.5 text-[0.625rem] font-semibold leading-tight transition ${
                  isActive
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                }`}
              >
                <PortalIcon name={destination.icon} className="h-5 w-5 shrink-0" />
                <span className="max-w-full truncate">{destination.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
