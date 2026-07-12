"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, UserPlus, Upload } from "lucide-react";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

const ic = "h-4 w-4 shrink-0 opacity-85";

const SUBNAV_ICONS = {
  list: <List className={ic} aria-hidden />,
  userPlus: <UserPlus className={ic} aria-hidden />,
  upload: <Upload className={ic} aria-hidden />,
} as const;

export type AdminSubnavIconKey = keyof typeof SUBNAV_ICONS;

export type AdminSubnavItem = {
  href: string;
  label: string;
  hint?: string;
  icon?: AdminSubnavIconKey;
  /** Stable Driver.js / help-tour anchor (`data-tour`). */
  tourId?: string;
};

export interface AdminSectionSubnavProps {
  ariaLabel: string;
  items: AdminSubnavItem[];
}

export function AdminSectionSubnav({ ariaLabel, items }: AdminSectionSubnavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={ariaLabel}
      data-tour={ADMIN_TOUR_ANCHORS.usersSubnav}
      className="flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-3"
    >
      {items.map(({ href, label, hint, icon, tourId }) => {
        const active = pathname === href;
        const glyph = icon ? SUBNAV_ICONS[icon] : null;
        return (
          <Link
            key={href}
            href={href}
            title={hint}
            {...(tourId ? { "data-tour": tourId } : {})}
            className={`flex min-h-[44px] items-center gap-2 rounded-[var(--layout-border-radius)] px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                : "text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
            }`}
          >
            {glyph}
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
