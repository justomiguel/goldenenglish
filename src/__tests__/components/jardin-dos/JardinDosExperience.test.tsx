import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { JardinDosExperience } from "@/components/organisms/jardin-dos/JardinDosExperience";
import es from "@/dictionaries/es.json";
import { genericKindDefaultPalette } from "@/lib/theme/genericInstituteTemplates";
import { templatePreviewHref } from "@/lib/theme/templatePalette";

vi.mock("@/app/[locale]/contact/freeSiteContactAction", () => ({
  submitGenericLandingContactAction: vi.fn(async () => ({ ok: false, errorCode: "preview" })),
}));

const copy = es.landing.genericLandings.jardin2;

describe("JardinDosExperience", () => {
  it("opens a stage in the visit form and keeps the mail link", async () => {
    const palette = genericKindDefaultPalette("jardin2");
    render(
      <JardinDosExperience
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
    expect(templatePreviewHref("es", "jardin2", palette)).toContain(
      `primary=${encodeURIComponent(palette.primary)}`,
    );
    const user = userEvent.setup();
    await user.click(screen.getAllByRole("button", { name: copy.cta })[1]!);
    expect(screen.getByLabelText(copy.levelLabel)).toHaveValue("menor");
    expect(screen.getByRole("link", { name: copy.mailCta })).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:hola@example.com"),
    );
  });
});
