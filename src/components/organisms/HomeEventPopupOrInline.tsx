"use client";

import { useSyncExternalStore, type ComponentProps } from "react";
import { createPortal } from "react-dom";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { HomeEventPopup } from "@/components/organisms/HomeEventPopup";
import { HomeEventPopupSlide } from "@/components/organisms/HomeEventPopupSlide";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { trackEvent } from "@/lib/analytics/trackClient";

/** The landing places this empty element where the inline card belongs. */
export const HOME_EVENT_INLINE_SLOT_ID = "home-event-inline-slot";

type HomeEventPopupOrInlineProps = ComponentProps<typeof HomeEventPopup>;

function subscribeNever(): () => void {
  return () => {};
}

function useInlineSlot(): HTMLElement | null {
  return useSyncExternalStore(
    subscribeNever,
    () => document.getElementById(HOME_EVENT_INLINE_SLOT_ID),
    () => null,
  );
}

function HomeEventInlineCard({ locale, events, labels }: HomeEventPopupOrInlineProps) {
  const slot = useInlineSlot();
  const next = events[0];
  if (!slot) return <HomeEventPopup locale={locale} events={events} labels={labels} />;
  if (!next) return null;

  return createPortal(
    <section
      aria-label={labels.dialogTitle}
      className="mx-[max(1rem,env(safe-area-inset-left))] my-6 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
    >
      <p className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">{labels.dialogTitle}</p>
      <HomeEventPopupSlide
        locale={locale}
        event={next}
        labels={labels}
        onOpenEvent={(eventId) => {
          trackEvent("click", AnalyticsEntity.events, {
            surface: "home_inline",
            event_id: eventId,
            intent: "open_register",
          });
        }}
      />
    </section>,
    slot,
  );
}

/**
 * Desktop keeps the event modal. Narrow screens render the next event as a
 * card in the landing slot, so the first visit shows one layer at a time.
 * Without a slot the modal stays, so other themes keep their behavior.
 */
export function HomeEventPopupOrInline(props: HomeEventPopupOrInlineProps) {
  if (props.events.length === 0) return null;
  return (
    <SurfaceMountGate
      skeleton={null}
      desktop={<HomeEventPopup {...props} />}
      narrow={() => <HomeEventInlineCard {...props} />}
    />
  );
}
