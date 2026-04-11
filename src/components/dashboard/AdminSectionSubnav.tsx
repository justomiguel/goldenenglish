"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminSubnavItem = {
  href: string;
  label: string;
};

export interface AdminSectionSubnavProps {
  ariaLabel: string;
  items: AdminSubnavItem[];
}

export function AdminSectionSubnav({ ariaLabel, items }: AdminSectionSubnavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label={ariaLabel} className="flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-3">
      {items.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex min-h-[44px] items-center rounded-[var(--layout-border-radius)] px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                : "text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
