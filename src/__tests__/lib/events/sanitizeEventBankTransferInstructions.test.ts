import { describe, expect, it } from "vitest";
import {
  EVENT_BANK_TRANSFER_INSTRUCTIONS_MAX_LENGTH,
  sanitizeEventBankTransferInstructions,
} from "@/lib/events/sanitizeEventBankTransferInstructions";

describe("sanitizeEventBankTransferInstructions", () => {
  it("returns null for empty input", () => {
    expect(sanitizeEventBankTransferInstructions("")).toBeNull();
    expect(sanitizeEventBankTransferInstructions("   \n  ")).toBeNull();
    expect(sanitizeEventBankTransferInstructions(null)).toBeNull();
  });

  it("normalizes line endings and trims", () => {
    expect(sanitizeEventBankTransferInstructions("  Banco X\r\nCuenta 123  ")).toBe("Banco X\nCuenta 123");
  });

  it("caps length", () => {
    const long = "a".repeat(EVENT_BANK_TRANSFER_INSTRUCTIONS_MAX_LENGTH + 50);
    expect(sanitizeEventBankTransferInstructions(long)?.length).toBe(
      EVENT_BANK_TRANSFER_INSTRUCTIONS_MAX_LENGTH,
    );
  });
});
