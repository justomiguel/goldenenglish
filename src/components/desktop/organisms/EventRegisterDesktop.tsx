import type { ComponentProps } from "react";
import type { PublicEventDetail } from "@/lib/dashboard/events/loadEventForPublicLanding";
import type { EventRegistrationPaymentMethod } from "@/lib/events/resolveEventRegistrationPaymentMethods";
import { EventRegisterForm } from "@/components/organisms/EventRegisterForm";

interface EventRegisterDesktopProps {
  locale: string;
  event: PublicEventDetail;
  paymentMethods: EventRegistrationPaymentMethod[];
  labels: ComponentProps<typeof EventRegisterForm>["labels"];
}

export function EventRegisterDesktop({
  locale,
  event,
  paymentMethods,
  labels,
}: EventRegisterDesktopProps) {
  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
      <EventRegisterForm
        locale={locale}
        event={event}
        paymentMethods={paymentMethods}
        labels={labels}
      />
    </section>
  );
}
