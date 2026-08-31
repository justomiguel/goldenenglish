import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingQuestionnairesSection } from "@/components/organisms/LandingQuestionnairesSection";
import { dictEn } from "@/test/dictEn";

describe("LandingQuestionnairesSection", () => {
  it("renders nothing when empty", () => {
    const { container } = render(
      <LandingQuestionnairesSection locale="en" items={[]} labels={dictEn.landing.questionnaires} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a card and lock for private items", () => {
    render(
      <LandingQuestionnairesSection
        locale="en"
        items={[{ slug: "nps", title: "NPS", visibility: "private" }]}
        labels={dictEn.landing.questionnaires}
      />,
    );
    expect(screen.getByText("NPS")).toBeInTheDocument();
    expect(screen.getByLabelText(dictEn.landing.questionnaires.privateAria)).toBeInTheDocument();
  });
});
