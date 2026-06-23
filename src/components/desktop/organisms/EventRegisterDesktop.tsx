import type { ComponentProps } from "react";
import type { PublicEventDetail } from "@/lib/dashboard/events/loadEventForPublicLanding";
import type { EventRegistrationPaymentMethod } from "@/lib/events/resolveEventRegistrationPaymentMethods";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import { publicEventRegisterShellClass } from "@/lib/events/publicEventSurfaceClasses";
import { EventRegisterForm } from "@/components/organisms/EventRegisterForm";

interface EventRegisterDesktopProps {
  locale: string;
  event: PublicEventDetail;
  paymentMethods: EventRegistrationPaymentMethod[];
  surfaceVariant?: PublicEventSurfaceVariant;
  labels: ComponentProps<typeof EventRegisterForm>["labels"];
}

export function EventRegisterDesktop({
  locale,
  event,
  paymentMethods,
  surfaceVariant = "default",
  labels,
}: EventRegisterDesktopProps) {
  return (
    <section className={publicEventRegisterShellClass(surfaceVariant)}>
      <EventRegisterForm
        locale={locale}
        event={event}
        paymentMethods={paymentMethods}
        surfaceVariant={surfaceVariant}
        labels={labels}
      />
    </section>
  );
}
