import { describe, expect, it } from "vitest";
import { summarizeEventSale } from "@/lib/events/summarizeEventSale";

describe("summarizeEventSale", () => {
  it("reports free seats as a count and a percent", () => {
    const sale = summarizeEventSale({
      capacity: 10,
      confirmedCount: 4,
      pendingPaymentCount: 1,
      approvedPaymentCount: 3,
    });
    expect(sale.occupiedSeats).toBe(5);
    expect(sale.seatsLeft).toBe(5);
    expect(sale.freePercent).toBe(50);
    expect(sale.freeSeatsUnderOnePercent).toBe(false);
  });

  it("hides the percent when the room is full", () => {
    const sale = summarizeEventSale({
      capacity: 4,
      confirmedCount: 3,
      pendingPaymentCount: 1,
      approvedPaymentCount: 2,
    });
    expect(sale.seatsLeft).toBe(0);
    expect(sale.freePercent).toBeNull();
    expect(sale.freeSeatsUnderOnePercent).toBe(false);
  });

  it("marks a free share that rounds below 1 percent", () => {
    const sale = summarizeEventSale({
      capacity: 1000,
      confirmedCount: 999,
      pendingPaymentCount: 0,
      approvedPaymentCount: 1,
    });
    expect(sale.seatsLeft).toBe(1);
    expect(sale.freePercent).toBeNull();
    expect(sale.freeSeatsUnderOnePercent).toBe(true);
  });
});
