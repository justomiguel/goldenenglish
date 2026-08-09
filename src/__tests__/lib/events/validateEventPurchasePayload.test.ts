import { describe, expect, it } from "vitest";
import { validateEventPurchasePayload } from "@/lib/events/validateEventPurchasePayload";

const singleSeatEvent = {
  activePackageIds: [] as string[],
  allowMultipleTickets: false,
  maxTicketsPerRegistration: null,
  companionCollectDni: false,
  companionCollectBirthDate: false,
  companionCollectEmail: false,
};

const packagedMultiEvent = {
  ...singleSeatEvent,
  activePackageIds: ["pkg-1", "pkg-2"],
  allowMultipleTickets: true,
  maxTicketsPerRegistration: 3,
};

const companion = (over: Record<string, unknown> = {}) => ({
  firstName: "Ana",
  lastName: "Ruiz",
  ...over,
});

describe("validateEventPurchasePayload", () => {
  it("accepts a plain single-seat registration, as every event does today", () => {
    expect(validateEventPurchasePayload(singleSeatEvent, {})).toEqual({
      ok: true,
      ticketPackageId: null,
      companions: [],
    });
  });

  describe("packages", () => {
    it("refuses a package on an event that sells none", () => {
      expect(
        validateEventPurchasePayload(singleSeatEvent, { ticketPackageId: "pkg-1" }),
      ).toEqual({ ok: false, code: "package_not_allowed" });
    });

    it("demands a package once the event sells them", () => {
      expect(validateEventPurchasePayload(packagedMultiEvent, {})).toEqual({
        ok: false,
        code: "package_required",
      });
    });

    it("refuses a package that is not this event's, or is archived", () => {
      expect(
        validateEventPurchasePayload(packagedMultiEvent, { ticketPackageId: "pkg-other" }),
      ).toEqual({ ok: false, code: "package_not_found" });
    });

    it("accepts one of the event's own packages", () => {
      expect(
        validateEventPurchasePayload(packagedMultiEvent, { ticketPackageId: "pkg-2" }),
      ).toMatchObject({ ok: true, ticketPackageId: "pkg-2" });
    });
  });

  describe("seats", () => {
    it("refuses companions when the event sells one seat at a time", () => {
      expect(
        validateEventPurchasePayload(singleSeatEvent, { companions: [companion()] }),
      ).toEqual({ ok: false, code: "multiple_tickets_not_allowed" });
    });

    it("refuses more seats than the event's maximum", () => {
      const result = validateEventPurchasePayload(packagedMultiEvent, {
        ticketPackageId: "pkg-1",
        companions: [companion(), companion(), companion()],
      });
      expect(result).toEqual({ ok: false, code: "too_many_tickets" });
    });

    it("accepts exactly the maximum, counting the titular", () => {
      const result = validateEventPurchasePayload(packagedMultiEvent, {
        ticketPackageId: "pkg-1",
        companions: [companion(), companion()],
      });
      expect(result).toMatchObject({ ok: true });
    });

    it("demands a first and last name for every companion", () => {
      expect(
        validateEventPurchasePayload(packagedMultiEvent, {
          ticketPackageId: "pkg-1",
          companions: [companion({ lastName: "   " })],
        }),
      ).toEqual({ ok: false, code: "companion_name_required" });
    });
  });

  describe("companion fields the event did not ask for", () => {
    it("drops them rather than storing data nobody consented to", () => {
      const result = validateEventPurchasePayload(packagedMultiEvent, {
        ticketPackageId: "pkg-1",
        companions: [
          companion({ dniOrPassport: "1234", email: "a@b.co", birthDate: "2010-01-01" }),
        ],
      });

      expect(result).toMatchObject({ ok: true });
      if (!result.ok) return;
      expect(result.companions[0]).toEqual({
        firstName: "Ana",
        lastName: "Ruiz",
        fieldValues: [],
      });
    });

    it("keeps the ones it does ask for, trimmed", () => {
      const result = validateEventPurchasePayload(
        { ...packagedMultiEvent, companionCollectDni: true, companionCollectEmail: true },
        {
          ticketPackageId: "pkg-1",
          companions: [companion({ dniOrPassport: " 1234 ", email: " A@B.CO ", birthDate: "2010-01-01" })],
        },
      );

      expect(result).toMatchObject({ ok: true });
      if (!result.ok) return;
      expect(result.companions[0]).toMatchObject({
        dniOrPassport: "1234",
        email: "a@b.co",
      });
      expect(result.companions[0]).not.toHaveProperty("birthDate");
    });
  });

  it("rejects a companion list that is not a list", () => {
    expect(
      validateEventPurchasePayload(packagedMultiEvent, {
        ticketPackageId: "pkg-1",
        companions: "three" as unknown as [],
      }),
    ).toEqual({ ok: false, code: "invalid_companions" });
  });

  it("never accepts a price from the caller", () => {
    // There is nowhere in the accepted shape to put one; the RPC recomputes
    // everything from the database.
    const result = validateEventPurchasePayload(packagedMultiEvent, {
      ticketPackageId: "pkg-1",
      companions: [companion({ price: 1, total: 1 })],
    });

    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.companions[0]).not.toHaveProperty("price");
    expect(result.companions[0]).not.toHaveProperty("total");
  });
});
