import { describe, expect, it } from "vitest";
import { formatMoneyLabel } from "@/lib/billing/formatMoneyLabel";

describe("formatMoneyLabel", () => {
  it("formats CLP without decimals for es-CL", () => {
    expect(formatMoneyLabel(120000, "CLP", "es-CL")).toMatch(/120.?000/);
  });

  it("formats USD for en-US", () => {
    expect(formatMoneyLabel(99, "USD", "en-US")).toMatch(/\$99/);
  });
});
