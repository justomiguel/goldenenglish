import type { ReactNode } from "react";
import Link from "next/link";
import { Calendar, MapPin, Ticket, UserPlus } from "lucide-react";
import type { EventPriceSource } from "@/lib/events/resolveEventPriceTier";
import { formatEventDate } from "@/lib/events/formatEventDate";
import { PublicEventPriceDisplay } from "@/components/molecules/PublicEventPriceDisplay";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import { publicEventDetailPanelChrome } from "@/lib/events/publicEventSurfaceClasses";

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
  const chrome = publicEventDetailPanelChrome(surfaceVariant);

  return (
    <div className={chrome.row}>
      <div className={chrome.icon} aria-hidden>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={chrome.label}>{label}</p>
        <div className={chrome.value}>{children}</div>
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
  const chrome = publicEventDetailPanelChrome(surfaceVariant);

  return (
    <aside className={chrome.aside} aria-label={labels.registrationCardTitle}>
      <div className={chrome.header}>
        <h2 className={chrome.headerTitle}>{labels.registrationCardTitle}</h2>
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

      <div className={chrome.footer}>
        <Link href={registerHref} className={chrome.cta}>
          <UserPlus className="h-4 w-4" aria-hidden />
          {labels.registerCta}
        </Link>
      </div>
    </aside>
  );
}
