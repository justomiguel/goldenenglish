"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminSurfaceIcon } from "@/lib/dashboard/adminSurfaceIcon";
import { navHrefPathPrefix } from "@/lib/dashboard/adminSidebarNavActive";
import type { WorkplaceNavGroup, WorkplaceNavItem } from "@/lib/dashboard/workplaceNav";

function itemCoversPath(pathname: string, item: WorkplaceNavItem): boolean {
  const prefix = navHrefPathPrefix(item.href);
  if (item.exact) return pathname === prefix;
  if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return true;
  return (item.matchPrefixes ?? []).some(
    (match) => pathname === match || pathname.startsWith(`${match}/`),
  );
}

function isActive(pathname: string, item: WorkplaceNavItem, all: readonly WorkplaceNavItem[]): boolean {
  if (!itemCoversPath(pathname, item)) return false;
  const selfLen = navHrefPathPrefix(item.href).length;
  let maxLen = selfLen;
  for (const other of all) {
    if (!itemCoversPath(pathname, other)) continue;
    maxLen = Math.max(maxLen, navHrefPathPrefix(other.href).length);
  }
  return selfLen === maxLen;
}

export function WorkplaceNavList({
  groups,
  ariaLabel,
  tourId,
  onNavigate,
  variant = "desktop",
}: {
  groups: WorkplaceNavGroup[];
  ariaLabel: string;
  tourId?: string;
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
}) {
  const pathname = usePathname();
  const all = groups.flatMap((group) => group.items);
  const mobile = variant === "mobile";

  return (
    <nav
      aria-label={ariaLabel}
      {...(tourId ? { "data-tour": tourId } : {})}
      className={mobile ? "space-y-4" : "space-y-5"}
    >
      {groups.map((group, index) => (
        <div
          key={index}
          className={
            mobile
              ? "rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)]/80 p-2 shadow-sm"
              : undefined
          }
        >
          {group.label ? (
            <h3
              className={`mb-1.5 px-3.5 text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] ${
                mobile ? "pt-1" : ""
              }`}
            >
              {group.label}
            </h3>
          ) : null}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item, all);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  title={item.tip}
                  {...(item.tourId ? { "data-tour": item.tourId } : {})}
                  className={`flex items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition ${
                    active
                      ? `bg-[color-mix(in_srgb,var(--color-primary)_12%,white)] text-[var(--color-primary)] ${
                          mobile ? "py-3" : "py-2.5"
                        }`
                      : `text-[var(--color-foreground)]/80 hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] ${
                          mobile ? "py-3" : "py-2.5"
                        }`
                  }`}
                >
                  {active ? (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                      {adminSurfaceIcon(item.iconId, "h-6 w-6")}
                    </span>
                  ) : (
                    adminSurfaceIcon(item.iconId, "h-6 w-6")
                  )}
                  <span className="flex-1 truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
