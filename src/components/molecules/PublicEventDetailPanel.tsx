import type { ReactNode } from "react";
import Link from "next/link";
import { Calendar, MapPin, Ticket, UserPlus } from "lucide-react";
import type { EventPriceSource } from "@/lib/events/resolveEventPriceTier";
import { formatEventDate } from "@/lib/events/formatEventDate";
import { PublicEventPriceDisplay } from "@/components/molecules/PublicEventPriceDisplay";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";

interface PublicEventDetailPanelProps {
  locale: string;
  eventDate: string;
  location: string | null;
  priceSource: EventPriceSource;
  currency: string;
  registerHref: string;
  surfaceVariant?: PublicEventSurfaceVariant;
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
  surfaceVariant = "default",
}: {
  icon: typeof Calendar;
  label: string;
  children: ReactNode;
  surfaceVariant?: PublicEventSurfaceVariant;
}) {
  const isEspacioZenit = surfaceVariant === "espaciozenit";

  return (
    <div
      className={
        isEspacioZenit
          ? "flex gap-3 border-t border-[rgb(0_174_239_/20%)] px-4 py-4 first:border-t-0"
          : "flex gap-3 border-t border-[var(--color-border)] px-4 py-4 first:border-t-0"
      }
    >
      <div
        className={
          isEspacioZenit
            ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgb(0_174_239_/12%)] text-[var(--ez-cyan)]"
            : "flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--layout-border-radius)] bg-[var(--color-muted)] text-[var(--color-secondary)]"
        }
        aria-hidden
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={
            isEspacioZenit
              ? "text-xs font-medium uppercase tracking-wide text-neutral-400"
              : "text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]"
          }
        >
          {label}
        </p>
        <div
          className={
            isEspacioZenit
              ? "mt-1 text-sm font-medium leading-snug text-neutral-100"
              : "mt-1 text-sm font-medium leading-snug text-[var(--color-foreground)]"
          }
        >
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
  surfaceVariant = "default",
  labels,
}: PublicEventDetailPanelProps) {
  const formattedDate = formatEventDate(eventDate, locale);
  const isEspacioZenit = surfaceVariant === "espaciozenit";

  return (
    <aside
      className={
        isEspacioZenit
          ? "overflow-hidden rounded-[22px] border border-[rgb(0_174_239_/35%)] bg-black shadow-[0_28px_70px_rgb(0_0_0_/40%)]"
          : "overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"
      }
      aria-label={labels.registrationCardTitle}
    >
      <div
        className={
          isEspacioZenit
            ? "border-b border-[rgb(0_174_239_/20%)] px-4 py-3"
            : "border-b border-[var(--color-border)] bg-[var(--color-muted)]/30 px-4 py-3"
        }
      >
        <h2
          className={
            isEspacioZenit
              ? "text-sm font-bold uppercase tracking-[0.12em] text-white"
              : "text-sm font-semibold text-[var(--color-foreground)]"
          }
        >
          {labels.registrationCardTitle}
        </h2>
      </div>

      <MetaRow icon={Calendar} label={labels.dateLabel} surfaceVariant={surfaceVariant}>
        <time dateTime={eventDate}>{formattedDate}</time>
      </MetaRow>

      {location ? (
        <MetaRow icon={MapPin} label={labels.locationLabel} surfaceVariant={surfaceVariant}>
          {location}
        </MetaRow>
      ) : null}

      <MetaRow icon={Ticket} label={labels.priceLabel} surfaceVariant={surfaceVariant}>
        <PublicEventPriceDisplay
          source={priceSource}
          currency={currency}
          locale={locale}
          surfaceVariant={surfaceVariant}
          labels={{
            free: labels.free,
            priceLocal: labels.priceLocal,
            priceNonLocal: labels.priceNonLocal,
          }}
          variant="featured"
        />
      </MetaRow>

      <div
        className={
          isEspacioZenit
            ? "border-t border-[rgb(0_174_239_/20%)] p-4"
            : "border-t border-[var(--color-border)] p-4"
        }
      >
        <Link
          href={registerHref}
          className={
            isEspacioZenit
              ? "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--ez-cyan)] px-4 py-3 text-sm font-bold uppercase tracking-[0.1em] text-black shadow-[0_12px_36px_rgb(0_174_239_/28%)] transition hover:bg-[var(--ez-cyan-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ez-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              : "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          }
        >
          <UserPlus className="h-4 w-4" aria-hidden />
          {labels.registerCta}
        </Link>
      </div>
    </aside>
  );
}
