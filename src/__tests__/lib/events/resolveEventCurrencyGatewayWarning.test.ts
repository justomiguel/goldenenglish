import { describe, expect, it } from "vitest";
import { shouldWarnEventCurrencyGateway } from "@/lib/events/resolveEventCurrencyGatewayWarning";

describe("shouldWarnEventCurrencyGateway", () => {
  it("does not warn for free events regardless of currency", () => {
    expect(
      shouldWarnEventCurrencyGateway({ currency: "USD", priceLocal: "", priceNonLocal: "" }),
    ).toBe(false);
    expect(
      shouldWarnEventCurrencyGateway({ currency: "USD", priceLocal: "0", priceNonLocal: "0" }),
    ).toBe(false);
  });

  it("does not warn for paid events in supported currencies", () => {
    expect(
      shouldWarnEventCurrencyGateway({ currency: "CLP", priceLocal: "15000", priceNonLocal: "" }),
    ).toBe(false);
    expect(
      shouldWarnEventCurrencyGateway({ currency: "ARS", priceLocal: "", priceNonLocal: "5000" }),
    ).toBe(false);
  });

  it("warns for paid events in an unsupported currency", () => {
    expect(
      shouldWarnEventCurrencyGateway({ currency: "USD", priceLocal: "20", priceNonLocal: "" }),
    ).toBe(true);
    expect(
      shouldWarnEventCurrencyGateway({ currency: "brl", priceLocal: "", priceNonLocal: "50" }),
    ).toBe(true);
  });

  it("does not warn when currency is empty", () => {
    expect(
      shouldWarnEventCurrencyGateway({ currency: "", priceLocal: "100", priceNonLocal: "" }),
    ).toBe(false);
  });
});
