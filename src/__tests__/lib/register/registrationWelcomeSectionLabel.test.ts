/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { registrationWelcomeSectionLabel } from "@/lib/register/registrationWelcomeSectionLabel";

describe("registrationWelcomeSectionLabel", () => {
  it("uses the fallback when no section was committed", () => {
    expect(
      registrationWelcomeSectionLabel({
        feeSnapshot: { lines: [{ sectionId: "a", sectionName: "A2" }] },
        committedSectionIds: [],
        fallback: "horario por asignar",
      }),
    ).toBe("horario por asignar");
  });

  it("joins committed section names from the snapshot", () => {
    expect(
      registrationWelcomeSectionLabel({
        feeSnapshot: {
          lines: [
            { sectionId: "a", sectionName: "A2 Mañana" },
            { sectionId: "b", sectionName: "Taller" },
          ],
        },
        committedSectionIds: ["a", "b"],
        fallback: "—",
      }),
    ).toBe("A2 Mañana, Taller");
  });
});
