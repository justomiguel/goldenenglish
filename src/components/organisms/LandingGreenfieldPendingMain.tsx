import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Dictionary } from "@/types/i18n";

interface LandingGreenfieldPendingMainProps {
  locale: string;
  dict: Dictionary;
}

export function LandingGreenfieldPendingMain({
  locale,
  dict,
}: LandingGreenfieldPendingMainProps) {
  const copy = dict.landing.greenfieldPending;
  const g = dict.greenfieldPublic;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:py-24">
      <h1 className="font-display text-balance text-2xl font-semibold tracking-tight text-[var(--color-primary)] sm:text-3xl">
        {copy.title}
      </h1>
      <p className="mt-4 max-w-lg text-balance text-sm leading-relaxed text-[var(--color-muted-foreground)] sm:text-base">
        {copy.lead}
      </p>
      <p
        className="mt-6 max-w-md text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]"
        role="note"
        aria-label={g.platformCreditAria}
      >
        {g.platformCredit}
      </p>
      <Link
        href={`/${locale}/setup/first-run`}
        className="mt-8 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-6 py-3 text-base font-semibold text-[var(--color-primary-foreground)] shadow-md transition hover:bg-[var(--color-primary-dark)] active:scale-[0.98]"
      >
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2} />
        {copy.cta}
      </Link>
    </main>
  );
}
