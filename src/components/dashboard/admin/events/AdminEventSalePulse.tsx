import { fillTemplate } from "@/lib/i18n/fillTemplate";
import type { EventSaleSnapshot } from "@/lib/events/summarizeEventSale";

export interface AdminEventSalePulseLabels {
  title: string;
  progress: string;
  approved: string;
  free: string;
  freeUnderOne: string;
  full: string;
}

interface AdminEventSalePulseProps {
  locale: string;
  sale: EventSaleSnapshot;
  labels: AdminEventSalePulseLabels;
}

export function AdminEventSalePulse({ locale, sale, labels }: AdminEventSalePulseProps) {
  const number = new Intl.NumberFormat(locale);
  const progress = fillTemplate(labels.progress, {
    confirmed: number.format(sale.confirmedCount),
    pending: number.format(sale.pendingPaymentCount),
  });
  const approved = fillTemplate(labels.approved, {
    count: number.format(sale.approvedPaymentCount),
  });
  const seats =
    sale.seatsLeft > 0
      ? fillTemplate(sale.freeSeatsUnderOnePercent ? labels.freeUnderOne : labels.free, {
          count: number.format(sale.seatsLeft),
          percent: number.format(sale.freePercent ?? 0),
        })
      : labels.full;

  return (
    <section
      aria-labelledby="event-sale-pulse"
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 shadow-[var(--shadow-soft)]"
    >
      <h2 id="event-sale-pulse" className="text-sm font-semibold text-[var(--color-foreground)]">
        {labels.title}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-foreground)]">{progress}</p>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{approved}</p>
      <p className="mt-1 text-sm text-[var(--color-foreground)]">{seats}</p>
    </section>
  );
}
