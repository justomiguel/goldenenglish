"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { PortalDestination } from "@/lib/portal/portalShellTypes";
import { resolveActiveDestination } from "@/lib/portal/resolveActiveDestination";
import { withParentFocusHref } from "@/lib/parent/withParentFocusHref";
import { PortalIcon } from "@/components/portal/PortalIcon";

export interface PortalTopNavProps {
  destinations: PortalDestination[];
  ariaLabel: string;
  tourAnchor?: string;
}

export function PortalTopNav({ destinations, ariaLabel, tourAnchor }: PortalTopNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId");
  const sectionId = searchParams.get("sectionId");
  const activeId = resolveActiveDestination(pathname, destinations);

  return (
    <nav
      aria-label={ariaLabel}
      {...(tourAnchor ? { "data-tour": tourAnchor } : {})}
      className="min-w-0"
    >
      <ul className="m-0 flex items-center gap-1 p-0">
        {destinations.map((destination) => {
          const isActive = destination.id === activeId;
          return (
            <li key={destination.id}>
              <Link
                href={withParentFocusHref(destination.href, { studentId, sectionId })}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex min-h-[40px] items-center gap-2 rounded-full px-3.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                    : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                }`}
              >
                <PortalIcon name={destination.icon} className="h-4 w-4 shrink-0" />
                <span>{destination.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
