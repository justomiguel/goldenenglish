import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface PulsarActionLinkProps {
  href: string;
  tone: "primary" | "quiet";
  children: React.ReactNode;
}

const TONE_CLASS = {
  primary:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)]",
  quiet:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-sm font-semibold text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]",
} as const;

export function PulsarActionLink({ href, tone, children }: PulsarActionLinkProps) {
  return (
    <Link href={href} className={TONE_CLASS[tone]}>
      <ArrowRight className="h-4 w-4" aria-hidden />
      <span>{children}</span>
    </Link>
  );
}
