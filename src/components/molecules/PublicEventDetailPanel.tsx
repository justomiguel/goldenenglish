import type { ReactNode } from "react";
import Link from "next/link";
import { Calendar, MapPin, Ticket, UserPlus } from "lucide-react";
import type { EventPriceSource } from "@/lib/events/resolveEventPriceTier";
import { formatEventDate } from "@/lib/events/formatEventDate";
import { PublicEventPriceDisplay } from "@/components/molecules/PublicEventPriceDisplay";

interface PublicEventDetailPanelProps {
  locale: string;
  eventDate: string;
  location: string | null;
  priceSource: EventPriceSource;
  currency: string;
  registerHref: string;
  labels: {
    registrationCardTitle: string;
    dateLabel: string;
    locationLabel: string;
    priceLabel: string;
    free: string;
    priceLocal: string;
    priceNonLocal: string;
    registerCta: string;
  };
}

function MetaRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Calendar;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3 border-t border-[var(--color-border)] px-4 py-4 first:border-t-0">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--layout-border-radius)] bg-[var(--color-muted)] text-[var(--color-secondary)]"
        aria-hidden
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {label}
        </p>
        <div className="mt-1 text-sm font-medium leading-snug text-[var(--color-foreground)]">
          {children}
        </div>
      </div>
    </div>
  );
}

export function PublicEventDetailPanel({
  locale,
  eventDate,
  location,
  priceSource,
  currency,
  registerHref,
  labels,
}: PublicEventDetailPanelProps) {
  const formattedDate = formatEventDate(eventDate, locale);

  return (
    <aside
      className="overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"
      aria-label={labels.registrationCardTitle}
    >
      <div className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/30 px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
          {labels.registrationCardTitle}
        </h2>
      </div>

      <MetaRow icon={Calendar} label={labels.dateLabel}>
        <time dateTime={eventDate}>{formattedDate}</time>
      </MetaRow>

      {location ? (
        <MetaRow icon={MapPin} label={labels.locationLabel}>
          {location}
        </MetaRow>
      ) : null}

      <MetaRow icon={Ticket} label={labels.priceLabel}>
        <PublicEventPriceDisplay
          source={priceSource}
          currency={currency}
          locale={locale}
          labels={{
            free: labels.free,
            priceLocal: labels.priceLocal,
            priceNonLocal: labels.priceNonLocal,
          }}
          variant="featured"
        />
      </MetaRow>

      <div className="border-t border-[var(--color-border)] p-4">
        <Link
          href={registerHref}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
        >
          <UserPlus className="h-4 w-4" aria-hidden />
          {labels.registerCta}
        </Link>
      </div>
    </aside>
  );
}
