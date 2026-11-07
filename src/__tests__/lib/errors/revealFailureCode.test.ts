import { describe, expect, it } from "vitest";
import { explainCodedFailure, revealFailureCode } from "@/lib/errors/revealFailureCode";

describe("revealFailureCode", () => {
  it("appends a code the person can quote", () => {
    expect(revealFailureCode("Ese horario se llenó.", "section_full")).toBe(
      "Ese horario se llenó. (section_full)",
    );
  });

  it("does not repeat a code that is already in the sentence", () => {
    expect(revealFailureCode("Cupo lleno (section_full)", "section_full")).toBe(
      "Cupo lleno (section_full)",
    );
  });

  it("returns the code when the sentence is empty", () => {
    expect(revealFailureCode("  ", "gateway_error")).toBe("gateway_error");
  });
});

describe("explainCodedFailure", () => {
  const sentences = { section_full: "Ese horario se llenó." };

  it("uses the sentence for a known code", () => {
    expect(explainCodedFailure("section_full", sentences, "Genérico")).toBe(
      "Ese horario se llenó. (section_full)",
    );
  });

  it("keeps an unknown code visible", () => {
    expect(explainCodedFailure("mystery", sentences, "Genérico")).toBe("Genérico (mystery)");
  });
});
