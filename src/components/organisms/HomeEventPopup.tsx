"use client";

import { useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Modal } from "@/components/atoms/Modal";
import { HomeEventPopupSlide } from "@/components/organisms/HomeEventPopupSlide";
import type { HomeEventPopupEvent } from "@/lib/dashboard/events/loadHomeEventPopup";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { trackEvent } from "@/lib/analytics/trackClient";
import {
  readHomeEventPopupDismissal,
  shouldOpenHomeEventPopup,
  writeHomeEventPopupDismissal,
} from "@/lib/events/homeEventPopupDismissal";

interface HomeEventPopupProps {
  locale: string;
  events: HomeEventPopupEvent[];
  labels: {
    dialogTitle: string;
    close: string;
    previous: string;
    next: string;
    position: string;
    dateLabel: string;
    locationLabel: string;
    viewEvent: string;
    imageLoading: string;
    free: string;
    priceLocal: string;
    priceNonLocal: string;
  };
}

function formatPosition(template: string, current: number, total: number): string {
  return template.replace("{{current}}", String(current)).replace("{{total}}", String(total));
}

function subscribePopupDismissal(): () => void {
  return () => {};
}

function popupIsOpen(idKey: string): boolean {
  const ids = idKey.length > 0 ? idKey.split(",") : [];
  return shouldOpenHomeEventPopup(readHomeEventPopupDismissal(), ids);
}

export function HomeEventPopup({ locale, events, labels }: HomeEventPopupProps) {
  const eventIds = events.map((event) => event.id);
  const idKey = eventIds.join(",");
  const [closedKey, setClosedKey] = useState<string | null>(null);
  const [cursor, setCursor] = useState({ key: idKey, index: 0 });
  const storedOpen = useSyncExternalStore(
    subscribePopupDismissal,
    () => popupIsOpen(idKey),
    () => false,
  );
  if (cursor.key !== idKey) {
    setCursor({ key: idKey, index: 0 });
  }
  const open = storedOpen && closedKey !== idKey;
  const index = cursor.key === idKey ? cursor.index : 0;

  if (!open || events.length === 0) return null;

  const safeIndex = index % events.length;
  const current = events[safeIndex];
  if (!current) return null;
  const several = events.length > 1;

  function dismiss() {
    writeHomeEventPopupDismissal(eventIds);
    trackEvent("click", AnalyticsEntity.events, {
      surface: "home_popup",
      event_id: current.id,
      intent: "dismiss",
    });
    setClosedKey(idKey);
  }

  function step(delta: number) {
    setCursor((value) => ({
      key: idKey,
      index: ((value.key === idKey ? value.index : 0) + delta + events.length) % events.length,
    }));
  }

  function onCarouselKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!several) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
  }

  return (
    <Modal
      open
      onOpenChange={(next) => {
        if (!next) dismiss();
      }}
      titleId="home-event-popup-title"
      title={labels.dialogTitle}
      closeLabel={labels.close}
      dialogClassName="sm:max-w-xl"
    >
      <section
        role="region"
        aria-label={labels.dialogTitle}
        aria-roledescription={several ? "carousel" : undefined}
        tabIndex={several ? 0 : undefined}
        onKeyDown={onCarouselKeyDown}
        className="space-y-4 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      >
        {several ? (
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
              aria-label={labels.previous}
              onClick={() => step(-1)}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <p className="text-sm text-[var(--color-foreground)]" aria-live="polite">
              {formatPosition(labels.position, safeIndex + 1, events.length)}
            </p>
            <button
              type="button"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
              aria-label={labels.next}
              onClick={() => step(1)}
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : null}
        <HomeEventPopupSlide
          key={current.id}
          locale={locale}
          event={current}
          labels={labels}
          onOpenEvent={(eventId) => {
            trackEvent("click", AnalyticsEntity.events, {
              surface: "home_popup",
              event_id: eventId,
              intent: "open_event",
            });
          }}
        />
      </section>
    </Modal>
  );
}
