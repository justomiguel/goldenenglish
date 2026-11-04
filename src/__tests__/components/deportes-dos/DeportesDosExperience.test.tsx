import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DeportesDosExperience } from "@/components/organisms/deportes-dos/DeportesDosExperience";
import es from "@/dictionaries/es.json";
import { genericKindDefaultPalette } from "@/lib/theme/genericInstituteTemplates";
import { templatePreviewHref } from "@/lib/theme/templatePalette";

vi.mock("@/app/[locale]/contact/freeSiteContactAction", () => ({
  submitGenericLandingContactAction: vi.fn(async () => ({ ok: false, errorCode: "preview" })),
}));

const copy = es.landing.genericLandings.deportes2;

describe("DeportesDosExperience", () => {
  it("keeps the trial link and paints from the chosen palette", async () => {
    const palette = genericKindDefaultPalette("deportes2");
    render(
      <DeportesDosExperience
        copy={copy}
        locale="es"
        siteName={copy.name}
        mailTo="hola@example.com"
        contactLabels={es.landing.genericContact}
        menu={es.landing.templateNav}
        sectionLabels={es.landing.genericSectionLabels}
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: copy.title })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.mailCta })).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:hola@example.com"),
    );
    expect(templatePreviewHref("es", "deportes2", palette)).toContain(
      `primary=${encodeURIComponent(palette.primary)}`,
    );
    const user = userEvent.setup();
    const actions = screen.getAllByRole("button", { name: copy.cta });
    await user.click(actions[2]!);
    expect(screen.getByLabelText(copy.disciplineLabel)).toHaveValue("boxeo");
  });
});
