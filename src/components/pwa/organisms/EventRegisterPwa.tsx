import type { ComponentProps } from "react";
import type { PublicEventDetail } from "@/lib/dashboard/events/loadEventForPublicLanding";
import type { EventRegistrationPaymentMethod } from "@/lib/events/resolveEventRegistrationPaymentMethods";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import { publicEventRegisterShellClass } from "@/lib/events/publicEventSurfaceClasses";
import { EventRegisterForm } from "@/components/organisms/EventRegisterForm";

interface EventRegisterPwaProps {
  locale: string;
  event: PublicEventDetail;
  paymentMethods: EventRegistrationPaymentMethod[];
  surfaceVariant?: PublicEventSurfaceVariant;
  labels: ComponentProps<typeof EventRegisterForm>["labels"];
}

export function EventRegisterPwa({
  locale,
  event,
  paymentMethods,
  surfaceVariant = "default",
  labels,
}: EventRegisterPwaProps) {
  return (
    <section
      className={publicEventRegisterShellClass(surfaceVariant)}
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
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
