import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PublicEventDetail } from "@/lib/dashboard/events/loadEventForPublicLanding";
import type { EventRegisterFormLabels } from "@/lib/events/eventRegisterFormLabels";
import en from "@/dictionaries/en.json";

vi.mock("@/components/organisms/EventRegisterWhoStep", () => ({
  EventRegisterWhoStep: ({ step }: { step: string }) => <h2>{`who-${step}`}</h2>,
}));

vi.mock("@/components/organisms/EventRegisterAmountStep", () => ({
  EventRegisterAmountStep: () => <h2>amount</h2>,
}));

vi.mock("@/components/organisms/EventRegisterFormFooter", () => ({
  EventRegisterFormFooter: () => null,
}));

import { EventRegisterPurchaseFlow } from "@/components/organisms/EventRegisterPurchaseFlow";

const labels = en.events.register as unknown as EventRegisterFormLabels;
const form = {
  handleSubmit: vi.fn(),
  payment: {
    showPaymentPicker: false,
    showTransferInstructions: false,
    requiresTransferReceipt: false,
    ticketQuantity: 1,
    selectedSeatKeys: [],
    setSelectedSeatKeys: vi.fn(),
    receiptFieldError: "",
  },
  footer: {
    consent: false,
    setConsent: vi.fn(),
    isPending: false,
    uploadPercent: null,
    message: "",
  },
} as unknown as Parameters<typeof EventRegisterPurchaseFlow>[0]["form"];

function event(showMap: boolean): PublicEventDetail {
  return {
    allowMultipleTickets: false,
    seatMapConfig: showMap ? { enabled: true, floors: [] } : null,
  } as PublicEventDetail;
}

function renderFlow(showSeatPicker: boolean) {
  return render(
    <EventRegisterPurchaseFlow
      locale="en"
      event={event(showSeatPicker)}
      paymentMethods={[]}
      surfaceVariant="default"
      labels={labels}
      preview
      form={form}
      familyDiscount={false}
      setFamilyDiscount={vi.fn()}
      appliedCode={null}
      setAppliedCode={vi.fn()}
      showSeatPicker={showSeatPicker}
      totals={{
        unitPrice: null,
        seats: 1,
        adultTickets: 1,
        minorTickets: 0,
        minorUnitPrice: null,
        subtotal: null,
        finalTotal: null,
        hasDiscount: false,
        discountBadge: null,
        fixedAmount: null,
      }}
    />,
  );
}

describe("EventRegisterPurchaseFlow step order", () => {
  it("puts tickets before the name when the event has a seat map", () => {
    renderFlow(true);
    const headings = screen.getAllByRole("heading").map((node) => node.textContent);
    const tickets = headings.indexOf("Tickets and seats");
    const who = headings.indexOf("who-2");
    expect(tickets).toBeGreaterThanOrEqual(0);
    expect(who).toBeGreaterThan(tickets);
  });

  it("keeps the name first when the event has no seat map", () => {
    renderFlow(false);
    const headings = screen.getAllByRole("heading").map((node) => node.textContent);
    expect(headings[0]).toBe("who-1");
    expect(headings).not.toContain("Tickets and seats");
  });
});
