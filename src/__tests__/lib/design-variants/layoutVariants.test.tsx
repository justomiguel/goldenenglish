import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GenericLandingBands } from "@/components/organisms/generic-landing/GenericLandingBands";
import { GenericLandingClose } from "@/components/organisms/generic-landing/GenericLandingClose";
import { GenericLandingDay } from "@/components/organisms/generic-landing/GenericLandingDay";

const copy = {
  rhythmA: "08:00. Doors open",
  rhythmB: "09:00. Class starts",
  rhythmC: "10:00. Break",
  laterTitle: "Write when you can",
  laterBody: "The desk reads it in the morning.",
  cta: "Enroll",
  sections: {
    historia: "A quiet room.",
    oferta: "Three groups.",
    modalidades: "Morning and evening.",
    niveles: "From the first step.",
    certificaciones: "A paper at the end.",
  },
} as never;

describe("generic landing layout variants", () => {
  it("keeps the day layout attribute", () => {
    render(<GenericLandingDay layout="rule" copy={copy} />);
    expect(document.querySelector("[data-day-layout]")).toHaveAttribute("data-day-layout", "rule");
  });

  it("keeps the band layout attribute", () => {
    render(<GenericLandingBands layout="cluster" kind="jardin" copy={copy} />);
    expect(document.querySelector("[data-bands-layout]")).toHaveAttribute("data-bands-layout", "cluster");
  });

  it("keeps the close layout attribute", () => {
    render(<GenericLandingClose layout="quiet" copy={copy} locale="en" />);
    expect(document.querySelector("[data-close-layout]")).toHaveAttribute("data-close-layout", "quiet");
  });
});
