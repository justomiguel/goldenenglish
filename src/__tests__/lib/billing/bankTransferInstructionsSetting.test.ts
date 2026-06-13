import { describe, expect, it } from "vitest";
import { resolveBankTransferInstructions } from "@/lib/billing/resolveBankTransferInstructions";
import { sanitizeBankTransferInstructions } from "@/lib/billing/sanitizeBankTransferInstructions";

describe("sanitizeBankTransferInstructions", () => {
  it("normalizes whitespace and caps length", () => {
    expect(sanitizeBankTransferInstructions("  Banco X\r\nCuenta 123  ")).toBe("Banco X\nCuenta 123");
    expect(sanitizeBankTransferInstructions("")).toBeNull();
  });
});

describe("resolveBankTransferInstructions", () => {
  it("prefers event-specific instructions when present", () => {
    expect(
      resolveBankTransferInstructions("Evento ABC", "Global XYZ"),
    ).toBe("Evento ABC");
  });

  it("falls back to global finance instructions", () => {
    expect(resolveBankTransferInstructions(null, "Global XYZ")).toBe("Global XYZ");
    expect(resolveBankTransferInstructions("   ", "Global XYZ")).toBe("Global XYZ");
  });

  it("returns null when neither source has content", () => {
    expect(resolveBankTransferInstructions(null, null)).toBeNull();
  });
});
