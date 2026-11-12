// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import es from "@/dictionaries/es.json";
import { AdminRegistrationFamilyGuide } from "@/components/dashboard/AdminRegistrationFamilyGuide";
import { formatMozarthitosGuideSummary } from "@/lib/register/packs/mozarthitos/formatMozarthitosGuideSummary";

const labels = es.admin.registrations.mozarthitosGuide;
const extras = {
  pack: "mozarthitos",
  schemaVersion: 1,
  guide: { stage: "baby_mago", modality: "pack", ageBand: "6m_2y" },
};

describe("AdminRegistrationFamilyGuide", () => {
  it("renders stage, modality and age band", () => {
    render(<AdminRegistrationFamilyGuide tenantExtras={extras} labels={labels} />);
    expect(screen.getByText(labels.title)).toBeTruthy();
    expect(screen.getByText("Baby Mago")).toBeTruthy();
    expect(screen.getByText("Pack pregrabado")).toBeTruthy();
    expect(screen.getByText("De 6 meses a 2 años")).toBeTruthy();
  });

  it("renders nothing for rows without a guide tag", () => {
    const { container } = render(
      <AdminRegistrationFamilyGuide tenantExtras={{}} labels={labels} />,
    );
    expect(container.innerHTML).toBe("");
  });
});

describe("formatMozarthitosGuideSummary", () => {
  it("joins the three labels", () => {
    expect(formatMozarthitosGuideSummary(extras, labels)).toBe(
      "Baby Mago · Pack pregrabado · De 6 meses a 2 años",
    );
  });

  it("returns an empty string for other packs", () => {
    expect(formatMozarthitosGuideSummary({ pack: "nago" }, labels)).toBe("");
    expect(formatMozarthitosGuideSummary(null, labels)).toBe("");
  });
});
