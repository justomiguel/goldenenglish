"use client";

import type { ComponentProps } from "react";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import type { PublicEventDetail } from "@/lib/dashboard/events/loadEventForPublicLanding";
import type { EventRegistrationPaymentMethod } from "@/lib/events/resolveEventRegistrationPaymentMethods";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import { EventRegisterDesktop } from "@/components/desktop/organisms/EventRegisterDesktop";
import { EventRegisterPwa } from "@/components/pwa/organisms/EventRegisterPwa";
import { EventRegisterForm } from "@/components/organisms/EventRegisterForm";

interface EventRegisterSurfaceEntryProps {
  locale: string;
  event: PublicEventDetail;
  paymentMethods: EventRegistrationPaymentMethod[];
  surfaceVariant?: PublicEventSurfaceVariant;
  labels: ComponentProps<typeof EventRegisterForm>["labels"];
}

export function EventRegisterSurfaceEntry({
  locale,
  event,
  paymentMethods,
  surfaceVariant = "default",
  labels,
}: EventRegisterSurfaceEntryProps) {
  const skeletonClass =
    surfaceVariant === "espaciozenit"
      ? "h-48 animate-pulse rounded-[22px] bg-[rgb(0_174_239_/8%)]"
      : "h-48 animate-pulse rounded bg-[var(--color-muted)]";

  return (
    <SurfaceMountGate
      skeleton={
        <div className="space-y-2">
          <div className="h-8 w-40 animate-pulse rounded bg-[rgb(0_174_239_/8%)]" />
          <div className={skeletonClass} />
        </div>
      }
      desktop={
        <EventRegisterDesktop
          locale={locale}
          event={event}
          paymentMethods={paymentMethods}
          surfaceVariant={surfaceVariant}
          labels={labels}
        />
      }
      narrow={() => (
        <EventRegisterPwa
          locale={locale}
          event={event}
          paymentMethods={paymentMethods}
          surfaceVariant={surfaceVariant}
          labels={labels}
        />
      )}
    />
  );
}
