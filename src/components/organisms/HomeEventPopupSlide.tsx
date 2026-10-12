"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { PublicEventPriceDisplay } from "@/components/molecules/PublicEventPriceDisplay";
import type { HomeEventPopupEvent } from "@/lib/dashboard/events/loadHomeEventPopup";
import { formatEventDate } from "@/lib/events/formatEventDate";

interface HomeEventPopupSlideProps {
  locale: string;
  event: HomeEventPopupEvent;
  labels: {
    dateLabel: string;
    locationLabel: string;
    viewEvent: string;
    imageLoading: string;
    free: string;
    priceLocal: string;
    priceNonLocal: string;
  };
  onOpenEvent: (eventId: string) => void;
}

function coverIsUnoptimized(url: string): boolean {
  return url.startsWith("/images/") || url.startsWith("data:");
}

export function HomeEventPopupSlide({
  locale,
  event,
  labels,
  onOpenEvent,
}: HomeEventPopupSlideProps) {
  const [imageReady, setImageReady] = useState(false);
  const when = formatEventDate(event.eventDate, locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <article className="space-y-4 pb-[env(safe-area-inset-bottom)]">
      {event.coverImageUrl ? (
        <div
          className="relative aspect-[16/9] overflow-hidden rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]"
          aria-busy={!imageReady}
        >
          {imageReady ? null : (
            <span className="sr-only">{labels.imageLoading}</span>
          )}
          <Image
            src={event.coverImageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            className={`object-cover ${imageReady ? "opacity-100" : "opacity-0"}`}
            unoptimized={coverIsUnoptimized(event.coverImageUrl)}
            onLoad={() => setImageReady(true)}
            onError={() => setImageReady(true)}
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{event.title}</h3>
        {event.excerpt ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">{event.excerpt}</p>
        ) : null}
      </div>

      <dl className="space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" aria-hidden />
          <div>
            <dt className="text-[var(--color-muted-foreground)]">{labels.dateLabel}</dt>
            <dd>
              <time dateTime={event.eventDate}>{when}</time>
            </dd>
          </div>
        </div>
        {event.location ? (
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" aria-hidden />
            <div>
              <dt className="text-[var(--color-muted-foreground)]">{labels.locationLabel}</dt>
              <dd>{event.location}</dd>
            </div>
          </div>
        ) : null}
      </dl>

      <PublicEventPriceDisplay
        source={{
          price: event.price,
          priceLocal: event.priceLocal,
          priceNonLocal: event.priceNonLocal,
        }}
        currency={event.currency}
        locale={locale}
        labels={{
          free: labels.free,
          priceLocal: labels.priceLocal,
          priceNonLocal: labels.priceNonLocal,
        }}
      />

      <Link
        href={`/${locale}/events/${event.slug}`}
        onClick={() => onOpenEvent(event.id)}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-dark)]"
      >
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        {labels.viewEvent}
      </Link>
    </article>
  );
}
