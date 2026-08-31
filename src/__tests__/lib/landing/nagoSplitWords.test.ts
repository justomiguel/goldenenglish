import { describe, expect, it } from "vitest";
import { planNagoSplitWords } from "@/lib/landing/nagoSplitWords";

describe("planNagoSplitWords", () => {
  it("splits parts on spaces and builds the accessible label", () => {
    const planned = planNagoSplitWords([
      { text: "Capoeira que" },
      { text: "transforma.", accent: true },
    ]);
    expect(planned?.ariaLabel).toBe("Capoeira que transforma.");
    expect(planned?.words).toEqual([
      { text: "Capoeira", accent: false, delayIndex: 0 },
      { text: "que", accent: false, delayIndex: 1 },
      { text: "transforma.", accent: true, delayIndex: 2 },
    ]);
  });

  it("caps individual stagger at six words", () => {
    const planned = planNagoSplitWords([
      { text: "one two three four five six seven eight" },
    ]);
    expect(planned?.words.map((w) => w.delayIndex)).toEqual([
      0, 1, 2, 3, 4, 5, 5, 5,
    ]);
  });

  it("returns null for empty or whitespace-only parts", () => {
    expect(planNagoSplitWords([{ text: "   " }, { text: "" }])).toBeNull();
  });
});
