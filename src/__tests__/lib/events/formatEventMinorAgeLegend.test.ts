import { describe, expect, it } from "vitest";
import {
  formatEventMinorAgeLegend,
  minorTicketPersistence,
} from "@/lib/events/formatEventMinorAgeLegend";

// REGRESSION CHECK: A missing age must keep the old public sentence. Do not invent 18.

describe("formatEventMinorAgeLegend", () => {
  const template = "Menor: hasta {age} años. La edad se verifica en el evento.";

  it("fills an inclusive age from 1 to 99", () => {
    expect(formatEventMinorAgeLegend(template, 12)).toBe(
      "Menor: hasta 12 años. La edad se verifica en el evento.",
    );
    expect(formatEventMinorAgeLegend("Up to {{age}} years", 1)).toBe("Up to 1 years");
    expect(formatEventMinorAgeLegend(template, 99)).toContain("99");
  });

  it("returns null when the age is missing or outside 1 to 99", () => {
    expect(formatEventMinorAgeLegend(template, null)).toBeNull();
    expect(formatEventMinorAgeLegend(template, undefined)).toBeNull();
    expect(formatEventMinorAgeLegend(template, 0)).toBeNull();
    expect(formatEventMinorAgeLegend(template, 100)).toBeNull();
    expect(formatEventMinorAgeLegend(template, 12.5)).toBeNull();
  });
});

describe("minorTicketPersistence", () => {
  it("clears the age when minor tickets are off", () => {
    expect(
      minorTicketPersistence({
        allowMinorTickets: false,
        minorTicketPrice: 4000,
        minorMaxAge: 12,
      }),
    ).toEqual({
      ok: true,
      allow_minor_tickets: false,
      minor_ticket_price: null,
      minor_max_age: null,
    });
  });

  it("requires an age when minor tickets are on", () => {
    expect(
      minorTicketPersistence({
        allowMinorTickets: true,
        minorTicketPrice: 4000,
        minorMaxAge: null,
      }),
    ).toEqual({ ok: false, code: "minor_max_age_required" });
    expect(
      minorTicketPersistence({
        allowMinorTickets: true,
        minorTicketPrice: 4000,
        minorMaxAge: 12,
      }),
    ).toEqual({
      ok: true,
      allow_minor_tickets: true,
      minor_ticket_price: 4000,
      minor_max_age: 12,
    });
  });
});
