import Link from "next/link";
import { Pencil } from "lucide-react";

interface PublicEventAdminEditLinkProps {
  href: string;
  label: string;
  ariaLabel: string;
  className?: string;
}

export function PublicEventAdminEditLink({
  href,
  label,
  ariaLabel,
  className = "",
}: PublicEventAdminEditLinkProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={
        className ||
        "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-foreground)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-muted)]/40"
      }
    >
      <Pencil className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </Link>
  );
}
