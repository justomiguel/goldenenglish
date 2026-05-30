import type { ComponentProps } from "react";
import type { PublicEventDetail } from "@/lib/dashboard/events/loadEventForPublicLanding";
import type { EventRegistrationPaymentMethod } from "@/lib/events/resolveEventRegistrationPaymentMethods";
import { EventRegisterForm } from "@/components/organisms/EventRegisterForm";

interface EventRegisterPwaProps {
  locale: string;
  event: PublicEventDetail;
  paymentMethods: EventRegistrationPaymentMethod[];
  labels: ComponentProps<typeof EventRegisterForm>["labels"];
}

export function EventRegisterPwa({
  locale,
  event,
  paymentMethods,
  labels,
}: EventRegisterPwaProps) {
  return (
    <section
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <EventRegisterForm
        locale={locale}
        event={event}
        paymentMethods={paymentMethods}
        labels={labels}
      />
    </section>
  );
}
