"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, User } from "lucide-react";
import type { Dictionary } from "@/types/i18n";

export interface AssistantSidebarNavContentProps {
  locale: string;
  dict: Dictionary["dashboard"]["assistantNav"];
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
}

const ic = "h-4 w-4 shrink-0 opacity-80";

export function AssistantSidebarNavContent({
  locale,
  dict,
  onNavigate,
  variant = "desktop",
}: AssistantSidebarNavContentProps) {
  const pathname = usePathname();
  const base = `/${locale}/dashboard/assistant`;
  const profileHref = `/${locale}/dashboard/profile`;
  const mobile = variant === "mobile";

  const items: { href: string; label: string; icon: ReactNode; tip?: string }[] = [
    {
      href: base,
      label: dict.home,
      icon: <ClipboardList className={ic} aria-hidden />,
      tip: dict.tipHome,
    },
    {
      href: profileHref,
      label: dict.myProfile,
      icon: <User className={ic} aria-hidden />,
      tip: dict.tipMyProfile,
    },
  ];

  return (
    <nav aria-label={dict.aria} className={mobile ? "space-y-4" : "space-y-5"}>
      <div
        className={
          mobile
            ? "rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)]/80 p-2 shadow-sm"
            : undefined
        }
      >
        <h3
          className={`mb-1.5 px-3 text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--color-muted-foreground)] ${
            mobile ? "pt-1" : ""
          }`}
        >
          {dict.groupWorkspace}
        </h3>
        <div className="space-y-0.5">
          {items.map(({ href, label, icon, tip }) => {
            const isHome = href === base;
            const active = isHome
              ? pathname === base || pathname.startsWith(`${base}/`)
              : pathname === profileHref;
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
    </nav>
  );
}
