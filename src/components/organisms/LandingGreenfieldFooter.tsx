import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";

interface LandingGreenfieldFooterProps {
  dict: Dictionary;
  brand: BrandPublic;
}

export function LandingGreenfieldFooter({
  dict,
  brand,
}: LandingGreenfieldFooterProps) {
  const g = dict.greenfieldPublic;
  const legal = brand.legalName?.trim();

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-muted)]/25 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))]">
      <div className="mx-auto max-w-[var(--layout-max-width)] px-4 text-center">
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {dict.landing.greenfieldPending.footerNote}
        </p>
        <p
          className="mt-3 text-xs font-semibold tracking-wide text-[var(--color-primary)]"
          aria-label={g.platformCreditAria}
        >
          {g.platformCredit}
        </p>
        {legal ? (
          <p className="mt-2 text-sm font-medium text-[var(--color-foreground)]">
            {legal}
          </p>
        ) : null}
      </div>
    </footer>
  );
}
