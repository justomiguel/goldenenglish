/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { buildRegistrationPayBlock } from "@/lib/register/buildRegistrationPayBlock";

describe("buildRegistrationPayBlock", () => {
  it("returns a pay button when there is a URL", () => {
    const html = buildRegistrationPayBlock({
      payUrl: "https://example.com/es/matricula/abc",
      amountLabel: "CLP 80.000",
      ctaLabel: "Pagar matrícula",
      noFeeNote: "El instituto te va a confirmar el lugar.",
    });
    expect(html).toContain("https://example.com/es/matricula/abc");
    expect(html).toContain("Pagar matrícula");
    expect(html).toContain("CLP 80.000");
  });

  it("returns the no-fee note when there is no URL", () => {
    expect(
      buildRegistrationPayBlock({
        payUrl: "",
        amountLabel: "",
        ctaLabel: "Pagar matrícula",
        noFeeNote: "El instituto te va a confirmar el lugar.",
      }),
    ).toBe("<p style=\"margin:0;\">El instituto te va a confirmar el lugar.</p>");
  });
});
