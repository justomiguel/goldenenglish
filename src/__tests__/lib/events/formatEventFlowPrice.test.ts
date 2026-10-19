import { describe, expect, it } from "vitest";
import {
  formatEventFlowPriceLabel,
  registrationFlowPricesByEvent,
} from "@/lib/events/formatEventFlowPrice";

describe("formatEventFlowPriceLabel", () => {
  it("uses the free label for a missing or zero price", () => {
    expect(
      formatEventFlowPriceLabel({ price: 0, currency: "CLP", locale: "es", freeLabel: "Gratis" }),
    ).toBe("Gratis");
    expect(
      formatEventFlowPriceLabel({ price: null, currency: "CLP", locale: "es", freeLabel: "Gratis" }),
    ).toBe("Gratis");
  });

  it("formats a positive amount in the event currency", () => {
    const label = formatEventFlowPriceLabel({
      price: 40000,
      currency: "CLP",
      locale: "es",
      freeLabel: "Gratis",
    });
    expect(label).toContain("40");
    expect(label).not.toBe("Gratis");
  });
});

describe("registrationFlowPricesByEvent", () => {
  it("orders flows and picks the locale name", () => {
    const grouped = registrationFlowPricesByEvent(
      [
        {
          id: "later",
          eventId: "event-1",
          nameI18n: { es: "Visitante", en: "Guest" },
          position: 2,
          price: 80000,
        },
        {
          id: "first",
          eventId: "event-1",
          nameI18n: { en: "Academy" },
          position: 0,
          price: 0,
        },
      ],
      "es",
      new Map([["event-1", "en"]]),
    );

    expect(grouped.get("event-1")).toEqual([
      { id: "first", name: "Academy", price: 0 },
      { id: "later", name: "Visitante", price: 80000 },
    ]);
  });
});
