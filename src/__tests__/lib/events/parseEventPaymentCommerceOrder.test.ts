import { describe, expect, it } from "vitest";
import { parseEventPaymentIdFromCommerceOrder } from "@/lib/events/parseEventPaymentCommerceOrder";

describe("parseEventPaymentIdFromCommerceOrder", () => {
  it("extracts the uuid from the original format", () => {
    expect(parseEventPaymentIdFromCommerceOrder("event_payment:abc-123")).toBe("abc-123");
  });

  it("extracts the uuid from the retry-safe format with a suffix", () => {
    expect(parseEventPaymentIdFromCommerceOrder("event_payment:abc-123:k9f2")).toBe("abc-123");
  });

  it("trims surrounding whitespace", () => {
    expect(parseEventPaymentIdFromCommerceOrder("  event_payment:abc-123  ")).toBe("abc-123");
  });

  it("returns empty string for unrelated prefixes", () => {
    expect(parseEventPaymentIdFromCommerceOrder("tuition:abc-123")).toBe("");
  });

  it("returns empty string for null or undefined", () => {
    expect(parseEventPaymentIdFromCommerceOrder(null)).toBe("");
    expect(parseEventPaymentIdFromCommerceOrder(undefined)).toBe("");
  });
});
