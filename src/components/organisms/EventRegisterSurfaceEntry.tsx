"use client";

import type { ComponentProps } from "react";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import type { PublicEventDetail } from "@/lib/dashboard/events/loadEventForPublicLanding";
import type { EventRegistrationPaymentMethod } from "@/lib/events/resolveEventRegistrationPaymentMethods";
import { EventRegisterDesktop } from "@/components/desktop/organisms/EventRegisterDesktop";
import { EventRegisterPwa } from "@/components/pwa/organisms/EventRegisterPwa";
import { EventRegisterForm } from "@/components/organisms/EventRegisterForm";

interface EventRegisterSurfaceEntryProps {
  locale: string;
  event: PublicEventDetail;
  paymentMethods: EventRegistrationPaymentMethod[];
  labels: ComponentProps<typeof EventRegisterForm>["labels"];
}

export function EventRegisterSurfaceEntry({
  locale,
  event,
  paymentMethods,
  labels,
}: EventRegisterSurfaceEntryProps) {
  return (
    <SurfaceMountGate
      skeleton={
        <div className="space-y-2">
          <div className="h-8 w-40 animate-pulse rounded bg-[var(--color-muted)]" />
          <div className="h-48 animate-pulse rounded bg-[var(--color-muted)]" />
        </div>
      }
      desktop={
        <EventRegisterDesktop
          locale={locale}
          event={event}
          paymentMethods={paymentMethods}
          labels={labels}
        />
      }
      narrow={() => (
        <EventRegisterPwa
          locale={locale}
          event={event}
          paymentMethods={paymentMethods}
          labels={labels}
        />
      )}
    />
  );
}
