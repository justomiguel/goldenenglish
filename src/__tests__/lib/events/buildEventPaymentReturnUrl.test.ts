import { describe, expect, it } from "vitest";
import {
  buildEventPaymentReturnUrl,
  normalizeEventPaymentBannerStatus,
} from "@/lib/events/buildEventPaymentReturnUrl";

describe("buildEventPaymentReturnUrl", () => {
  it("builds the absolute return-bridge URL with locale, slug and status", () => {
    const url = new URL(
      buildEventPaymentReturnUrl("https://goldenenglish.cl", "es", "gala", "success"),
    );
    expect(url.pathname).toBe("/api/events/payment-return");
    expect(url.searchParams.get("locale")).toBe("es");
    expect(url.searchParams.get("slug")).toBe("gala");
    expect(url.searchParams.get("status")).toBe("success");
  });
});

describe("normalizeEventPaymentBannerStatus", () => {
  it("accepts known statuses regardless of case", () => {
    expect(normalizeEventPaymentBannerStatus("SUCCESS")).toBe("success");
    expect(normalizeEventPaymentBannerStatus(" pending ")).toBe("pending");
    expect(normalizeEventPaymentBannerStatus("processing")).toBe("processing");
    expect(normalizeEventPaymentBannerStatus("failure")).toBe("failure");
  });

  it("returns null for unknown or empty values", () => {
    expect(normalizeEventPaymentBannerStatus("approved")).toBeNull();
    expect(normalizeEventPaymentBannerStatus("")).toBeNull();
    expect(normalizeEventPaymentBannerStatus(null)).toBeNull();
    expect(normalizeEventPaymentBannerStatus(undefined)).toBeNull();
  });
});
