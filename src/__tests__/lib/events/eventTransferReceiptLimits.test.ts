import { describe, expect, it } from "vitest";
import {
  EVENT_TRANSFER_RECEIPT_MAX_BYTES,
  eventTransferReceiptMaxSizeMb,
  fillEventTransferReceiptMaxMbTemplate,
  isAllowedEventTransferReceiptMime,
  normalizeEventRegistrationDni,
  normalizeEventRegistrationEmail,
  validateEventTransferReceiptFile,
} from "@/lib/events/eventTransferReceiptLimits";

describe("eventTransferReceiptLimits", () => {
  it("uses at least 15 MB as the max upload size", () => {
    expect(EVENT_TRANSFER_RECEIPT_MAX_BYTES).toBeGreaterThanOrEqual(15 * 1024 * 1024);
    expect(eventTransferReceiptMaxSizeMb()).toBe(15);
  });

  it("fills {max} placeholders in copy templates", () => {
    expect(fillEventTransferReceiptMaxMbTemplate("Max {max} MB")).toBe("Max 15 MB");
  });

  it("normalizes email and document for verification", () => {
    expect(normalizeEventRegistrationEmail("  Ana@Example.COM ")).toBe("ana@example.com");
    expect(normalizeEventRegistrationDni(" 12.345.678-K ")).toBe("12.345.678-k");
  });

  it("accepts images and PDF only", () => {
    expect(isAllowedEventTransferReceiptMime("image/jpeg")).toBe(true);
    expect(isAllowedEventTransferReceiptMime("application/pdf")).toBe(true);
    expect(isAllowedEventTransferReceiptMime("application/zip")).toBe(false);
  });

  it("rejects files over 15 MB", () => {
    const result = validateEventTransferReceiptFile({
      size: EVENT_TRANSFER_RECEIPT_MAX_BYTES + 1,
      type: "image/jpeg",
    });
    expect(result).toEqual({ ok: false, code: "too_large" });
  });

  it("accepts valid receipt files up to the limit", () => {
    const result = validateEventTransferReceiptFile({
      size: EVENT_TRANSFER_RECEIPT_MAX_BYTES,
      type: "application/pdf",
    });
    expect(result).toEqual({ ok: true, mime: "application/pdf" });
  });

  it("rejects missing or empty files", () => {
    expect(validateEventTransferReceiptFile(null)).toEqual({ ok: false, code: "missing" });
    expect(validateEventTransferReceiptFile({ size: 0, type: "image/jpeg" })).toEqual({
      ok: false,
      code: "missing",
    });
  });

  it("rejects disallowed mime types", () => {
    expect(validateEventTransferReceiptFile({ size: 100, type: "application/zip" })).toEqual({
      ok: false,
      code: "invalid_type",
    });
    expect(validateEventTransferReceiptFile({ size: 100, type: "  " })).toEqual({
      ok: false,
      code: "invalid_type",
    });
  });
});
