import { describe, expect, it } from "vitest";
import { formatMercadoPagoReturnPageCopy } from "@/lib/student/formatMercadoPagoReturnPageCopy";
import type { Dictionary } from "@/types/i18n";

type MonthlyDict = Dictionary["dashboard"]["student"]["monthly"];

const monthly: MonthlyDict = {
  mpReturnNoRefTitle: "No reference",
  mpReturnNoRefLead: "We could not find the reference.",
  flowReturnUnauthorizedTitle: "Unauthorized",
  flowReturnUnauthorizedLead: "You are not authorized.",
  mpErrorUnavailable: "Service unavailable",
  mpReturnNotCompletedTitle: "Not completed",
  mpReturnNotCompletedLead: "Payment was not completed.",
  mpReturnProcessingTitle: "Processing",
  mpReturnProcessingLead: "Your payment is being processed.",
  mpReturnSuccessTitle: "Success!",
  mpReturnSuccessLead: "Payment for {month} {year} confirmed.",
} as unknown as MonthlyDict;

describe("formatMercadoPagoReturnPageCopy", () => {
  it("returns info variant for no_reference", () => {
    const result = formatMercadoPagoReturnPageCopy("en", monthly, { outcome: "no_reference" });
    expect(result.variant).toBe("default");
    expect(result.title).toBe("No reference");
  });

  it("returns error variant for misconfigured", () => {
    const result = formatMercadoPagoReturnPageCopy("en", monthly, { outcome: "misconfigured" });
    expect(result.variant).toBe("error");
    expect(result.lead).toBe("Service unavailable");
  });

  it("returns error variant for unauthorized_payment", () => {
    const result = formatMercadoPagoReturnPageCopy("en", monthly, { outcome: "unauthorized_payment" });
    expect(result.variant).toBe("error");
    expect(result.title).toBe("Unauthorized");
  });

  it("returns warning variant for not_paid", () => {
    const result = formatMercadoPagoReturnPageCopy("es", monthly, { outcome: "not_paid" });
    expect(result.variant).toBe("warning");
    expect(result.title).toBe("Not completed");
  });

  it("returns info variant for processing", () => {
    const result = formatMercadoPagoReturnPageCopy("en", monthly, { outcome: "processing" });
    expect(result.variant).toBe("default");
    expect(result.title).toBe("Processing");
  });

  it("returns warning variant for reconcile_error", () => {
    const result = formatMercadoPagoReturnPageCopy("en", monthly, { outcome: "reconcile_error" });
    expect(result.variant).toBe("warning");
    expect(result.lead).toBe("Your payment is being processed.");
  });

  it("returns success variant with interpolated month/year", () => {
    const result = formatMercadoPagoReturnPageCopy("en", monthly, {
      outcome: "success",
      month: 3,
      year: 2026,
      paymentId: "pay-1",
    });
    expect(result.variant).toBe("success");
    expect(result.title).toBe("Success!");
    expect(result.lead).toContain("2026");
    expect(result.lead).toContain("March");
  });

  it("uses locale for month name in success outcome", () => {
    const result = formatMercadoPagoReturnPageCopy("es", monthly, {
      outcome: "success",
      month: 6,
      year: 2026,
      paymentId: "pay-2",
    });
    expect(result.lead).toContain("junio");
    expect(result.lead).toContain("2026");
  });
});
