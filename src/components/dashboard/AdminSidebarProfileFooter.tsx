import Link from "next/link";
import type { Dictionary } from "@/types/i18n";

export function AdminSidebarProfileFooter({
  locale,
  dict,
  displayName,
  roleLabel,
  avatarUrl,
}: {
  locale: string;
  dict: Dictionary;
  displayName: string;
  roleLabel: string;
  avatarUrl: string | null;
}) {
  const initial = (displayName || roleLabel).trim().charAt(0).toUpperCase() || "?";
  const title = displayName || roleLabel;

  return (
    <Link
      href={`/${locale}/dashboard/profile`}
      data-tour="admin-sidebar-profile"
      aria-label={dict.dashboard.adminNav.myProfile}
      className="mx-3 mb-2 block rounded-2xl px-3 py-2.5 outline-none ring-[var(--color-primary)] hover:bg-[var(--color-muted)]/70 focus-visible:ring-2"
    >
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={title}
            className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-[var(--color-border)]"
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,white)] text-sm font-bold text-[var(--color-primary)] ring-1 ring-[var(--color-border)]">
            {initial}
          </span>
        )}
        <div className="min-w-0 text-left">
          <p className="truncate text-sm font-semibold leading-tight text-[var(--color-foreground)]">
            {title}
          </p>
          <p className="mt-0.5 truncate text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {roleLabel}
          </p>
        </div>
      </div>
    </Link>
  );
}
