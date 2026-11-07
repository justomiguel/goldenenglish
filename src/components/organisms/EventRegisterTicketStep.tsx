"use client";

import type { ReactNode } from "react";
import { EventRegisterMultiTicketSection } from "@/components/organisms/EventRegisterMultiTicketSection";
import { EventRegisterSeatPicker } from "@/components/organisms/EventRegisterSeatPicker";
import type { PublicEventDetail } from "@/lib/dashboard/events/loadEventForPublicLanding";
import type { EventRegisterFormLabels } from "@/lib/events/eventRegisterFormLabels";
import type { EventSeatLockSnapshot } from "@/lib/events/seatMapState";
import type { useEventRegisterForm } from "@/hooks/useEventRegisterForm";

interface EventRegisterTicketStepProps {
  event: PublicEventDetail;
  labels: EventRegisterFormLabels;
  form: ReturnType<typeof useEventRegisterForm>;
  showSeatPicker: boolean;
  seats: number;
  seatHold?: {
    locks?: readonly EventSeatLockSnapshot[];
    heldByOthers?: readonly string[];
    lostSeatKeys?: readonly string[];
    onBeforeSelect?: (seatKey: string) => Promise<boolean>;
    onSeatRefused?: (seatKey: string) => void;
  };
  seatNotice?: ReactNode;
  ticketPart?: "all" | "quantity";
}

export function EventRegisterTicketStep({
  event,
  labels,
  form,
  showSeatPicker,
  seats,
  seatHold,
  seatNotice,
  ticketPart = "all",
}: EventRegisterTicketStepProps) {
  return (
    <>
      {event.allowMultipleTickets && labels.companions ? (
        <EventRegisterMultiTicketSection
          ticketQuantity={form.payment.ticketQuantity}
          onTicketQuantityChange={form.payment.setTicketQuantity}
          requireCompanionDetails={Boolean(event.companionRequireDetails)}
          collectDni={Boolean(event.companionCollectDni)}
          collectEmail={Boolean(event.companionCollectEmail)}
          collectBirthDate={Boolean(event.companionCollectBirthDate)}
          companions={form.payment.companions}
          onCompanionChange={form.payment.updateCompanion}
          disabled={form.footer.isPending}
          labels={labels.companions}
          part={ticketPart === "quantity" ? "quantity" : "all"}
        />
      ) : null}
      {showSeatPicker && event.seatMapConfig && labels.seatMap ? (
        <>
          {seatNotice}
          <EventRegisterSeatPicker
            config={event.seatMapConfig}
            locks={seatHold?.locks ?? event.seatLocks ?? []}
            heldByOthers={seatHold?.heldByOthers}
            lostSeatKeys={seatHold?.lostSeatKeys}
            requiredSeatCount={seats}
            selectedSeatKeys={form.payment.selectedSeatKeys}
            onSelectedSeatKeysChange={form.payment.setSelectedSeatKeys}
            onBeforeSelect={seatHold?.onBeforeSelect}
            onSeatRefused={seatHold?.onSeatRefused}
            labels={labels.seatMap}
          />
        </>
      ) : null}
    </>
  );
}
