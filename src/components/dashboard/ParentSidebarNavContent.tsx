"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dictionary } from "@/types/i18n";
import {
  buildParentSidebarNavGroups,
  type ParentSidebarNavGroup,
} from "@/components/dashboard/parentSidebarNavGroups";

export interface ParentSidebarNavContentProps {
  locale: string;
  dict: Dictionary["dashboard"]["parentNav"];
  baseHref?: string;
  profileHref?: string;
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
}

function NavGroupBlock({
  group,
  base,
  profileHref,
  pathname,
  mobile,
  onNavigate,
}: {
  group: ParentSidebarNavGroup;
  base: string;
  profileHref: string;
  pathname: string;
  mobile: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div
      className={
        mobile
          ? "rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)]/80 p-2 shadow-sm"
          : undefined
      }
    >
      {group.label ? (
        <h3
          className={`mb-1.5 px-3 text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] ${
            mobile ? "pt-1" : ""
          }`}
        >
          {group.label}
        </h3>
      ) : null}
      <div className="space-y-0.5">
        {group.items.map(({ href, label, icon, tip }) => {
          const exact = href === base || href === profileHref;
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              title={tip}
              className={`flex items-center gap-2.5 rounded-[var(--layout-border-radius)] px-3 text-[0.8125rem] font-medium transition ${
                active
                  ? `border-l-2 border-[var(--color-primary)] text-[var(--color-primary)] ${
                      mobile
                        ? "bg-[var(--color-primary)]/10 py-3 pl-[0.625rem]"
                        : "bg-[var(--color-primary)]/8 py-2 pl-[0.625rem]"
                    }`
                  : `border-l-2 border-transparent text-[var(--color-foreground)]/80 hover:text-[var(--color-foreground)] ${
                      mobile ? "py-3 hover:bg-[var(--color-muted)]/80" : "py-2 hover:bg-[var(--color-muted)]"
                    }`
              }`}
            >
              {icon}
              <span className="flex-1 truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function ParentSidebarNavContent({
  locale,
  dict,
  baseHref = `/${locale}/dashboard/parent`,
  profileHref = `/${locale}/dashboard/profile`,
  onNavigate,
  variant = "desktop",
}: ParentSidebarNavContentProps) {
  const pathname = usePathname();
  const groups = buildParentSidebarNavGroups(baseHref, profileHref, dict);
  const mobile = variant === "mobile";

  return (
    <nav aria-label={dict.aria} className={mobile ? "space-y-4" : "space-y-5"}>
      {groups.map((group, gi) => (
        <NavGroupBlock
          key={gi}
          group={group}
          base={baseHref}
          profileHref={profileHref}
          pathname={pathname}
          mobile={mobile}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}
