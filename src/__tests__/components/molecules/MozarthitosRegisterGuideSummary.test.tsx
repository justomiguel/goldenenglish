// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import es from "@/dictionaries/es.json";
import { MozarthitosRegisterGuideSummary } from "@/components/molecules/MozarthitosRegisterGuideSummary";

describe("MozarthitosRegisterGuideSummary", () => {
  it("shows the chosen stage and modality with a link back to the guide", () => {
    render(
      <MozarthitosRegisterGuideSummary
        locale="es"
        guide={{ stage: "baby_mago", modality: "pack", ageBand: "6m_2y" }}
        labels={es.landing.mz.guide}
      />,
    );
    expect(screen.getByText("Elegiste: Baby Mago · Pack pregrabado")).toBeTruthy();
    const link = screen.getByRole("link", { name: /Cambiar/ });
    expect(link.getAttribute("href")).toBe("/es/encuentra-tu-clase");
  });
});
