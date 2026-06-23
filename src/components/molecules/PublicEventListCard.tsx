import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, MapPin, Ticket } from "lucide-react";
import type { PublicEventListRow } from "@/lib/dashboard/events/loadPublicEventsList";
import { buildEventAdminEditHref } from "@/lib/events/buildEventAdminEditHref";
import { formatEventDate } from "@/lib/events/formatEventDate";
import { htmlToPlain } from "@/lib/blog/htmlToPlain";
import { PublicEventPriceDisplay } from "@/components/molecules/PublicEventPriceDisplay";
import { PublicEventAdminEditLink } from "@/components/molecules/PublicEventAdminEditLink";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import {
  publicEventListCardCoverClass,
  publicEventListCardRootClass,
} from "@/lib/events/publicEventSurfaceClasses";

interface PublicEventListCardProps {
  locale: string;
  row: PublicEventListRow;
  showAdminEdit?: boolean;
  surfaceVariant?: PublicEventSurfaceVariant;
  labels: {
    dateLabel: string;
    priceLabel: string;
    free: string;
    priceLocal: string;
    priceNonLocal: string;
    viewDetail: string;
    adminEdit: string;
    adminEditAriaLabel: string;
  };
}

export function PublicEventListCard({
  locale,
  row,
  showAdminEdit = false,
  surfaceVariant = "default",
  labels,
}: PublicEventListCardProps) {
  const detailHref = `/${locale}/events/${row.slug}`;
  const excerpt = htmlToPlain(row.description);
  const coverUnoptimized =
    row.coverImageUrl?.startsWith("/images/") || row.coverImageUrl?.startsWith("data:");
  const isEspacioZenit = surfaceVariant === "espaciozenit";

  return (
    <article className={publicEventListCardRootClass(surfaceVariant)}>
      {row.coverImageUrl ? (
        <Link href={detailHref} className={publicEventListCardCoverClass(surfaceVariant)}>
          <Image
            src={row.coverImageUrl}
            alt={row.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            unoptimized={coverUnoptimized}
          />
        </Link>
      ) : null}

      <div className="flex flex-1 flex-col p-4">
        <h2
          className={
            isEspacioZenit
              ? "text-lg font-semibold leading-snug text-white"
              : "text-lg font-semibold leading-snug text-[var(--color-foreground)]"
          }
        >
          <Link
            href={detailHref}
            className={
              isEspacioZenit
                ? "hover:text-[var(--ez-cyan-soft)] hover:underline"
                : "hover:text-[var(--color-primary)] hover:underline"
            }
          >
            {row.title}
          </Link>
        </h2>

        {excerpt ? (
          <p
            className={
              isEspacioZenit
                ? "mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-neutral-300"
                : "mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[var(--color-muted-foreground)]"
            }
          >
            {excerpt}
          </p>
        ) : null}

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div
            className={
              isEspacioZenit
                ? "rounded-xl border border-[rgb(0_174_239_/20%)] bg-[rgb(0_174_239_/6%)] px-3 py-2.5"
                : "rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/25 px-3 py-2.5"
            }
          >
            <p
              className={
                isEspacioZenit
                  ? "inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-neutral-400"
                  : "inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]"
              }
            >
              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {labels.dateLabel}
            </p>
            <p
              className={
                isEspacioZenit
                  ? "mt-1 text-sm font-medium leading-snug text-neutral-100"
                  : "mt-1 text-sm font-medium leading-snug text-[var(--color-foreground)]"
              }
            >
              <time dateTime={row.eventDate}>
                {formatEventDate(row.eventDate, locale, { dateStyle: "medium", timeStyle: "short" })}
              </time>
            </p>
          </div>

          <div
            className={
              isEspacioZenit
                ? "rounded-xl border border-[rgb(0_174_239_/20%)] bg-[rgb(0_174_239_/6%)] px-3 py-2.5"
                : "rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/25 px-3 py-2.5"
            }
          >
            <p
              className={
                isEspacioZenit
                  ? "inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-neutral-400"
                  : "inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]"
              }
            >
              <Ticket className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {labels.priceLabel}
            </p>
            <div className="mt-1">
              <PublicEventPriceDisplay
                source={{
                  price: row.price,
                  priceLocal: row.priceLocal,
                  priceNonLocal: row.priceNonLocal,
                }}
                currency={row.currency}
                locale={locale}
                surfaceVariant={surfaceVariant}
                labels={{
                  free: labels.free,
                  priceLocal: labels.priceLocal,
                  priceNonLocal: labels.priceNonLocal,
                }}
                variant="compact"
              />
            </div>
          </div>
        </div>

        {row.location ? (
          <p
            className={
              isEspacioZenit
                ? "mt-2 inline-flex items-start gap-1.5 text-xs text-neutral-400"
                : "mt-2 inline-flex items-start gap-1.5 text-xs text-[var(--color-muted-foreground)]"
            }
          >
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{row.location}</span>
          </p>
        ) : null}

        <Link
          href={detailHref}
          className={
            isEspacioZenit
              ? "mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[rgb(0_174_239_/35%)] bg-black px-4 py-2.5 text-sm font-bold uppercase tracking-[0.08em] text-[var(--ez-cyan-soft)] transition-colors hover:border-[var(--ez-cyan)] hover:bg-[rgb(0_174_239_/8%)] hover:text-[var(--ez-cyan)]"
              : "mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--color-foreground)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-muted)]/40"
          }
        >
          {labels.viewDetail}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>

        {showAdminEdit ? (
          <PublicEventAdminEditLink
            href={buildEventAdminEditHref(locale, row.id)}
            label={labels.adminEdit}
            ariaLabel={labels.adminEditAriaLabel}
            className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/15 px-4 py-2.5 text-sm font-semibold text-[var(--color-foreground)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-muted)]/40"
          />
        ) : null}
      </div>
    </article>
  );
}
