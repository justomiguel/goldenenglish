// REGRESSION CHECK: Argentina voice converts second person only. Nouns and infinitives stay.
import { describe, expect, it } from "vitest";
import { toRioplatenseMarketingSentence } from "@/lib/pulsar/rioplatenseMarketingCopy";

describe("toRioplatenseMarketingSentence", () => {
  it("converts the visitor address and leaves Crear and muestra", () => {
    const source = "Elige una plantilla. Puedes crear tres sitios. Crear mi página. La muestra anual sigue.";
    const next = toRioplatenseMarketingSentence(source);
    expect(next).toContain("Elegí una plantilla");
    expect(next).toContain("Podés crear");
    expect(next).toContain("Crear mi página");
    expect(next).toContain("La muestra anual sigue.");
    expect(next).not.toMatch(/\bElige\b/);
    expect(next).not.toMatch(/\bPuedes\b/);
  });

  it("keeps third-person administra", () => {
    expect(toRioplatenseMarketingSentence("Tu equipo administra la operación.")).toBe(
      "Tu equipo administra la operación.",
    );
  });
});
