import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ColegioDosExperience } from "@/components/organisms/colegio-dos/ColegioDosExperience";
import es from "@/dictionaries/es.json";
import { genericKindDefaultPalette } from "@/lib/theme/genericInstituteTemplates";
import { templatePreviewHref } from "@/lib/theme/templatePalette";

vi.mock("@/app/[locale]/contact/freeSiteContactAction", () => ({
  submitGenericLandingContactAction: vi.fn(async () => ({ ok: false, errorCode: "preview" })),
}));

const copy = es.landing.genericLandings.colegio2;

describe("ColegioDosExperience", () => {
  it("filters the sample calendar and keeps the mail link", async () => {
    const palette = genericKindDefaultPalette("colegio2");
    render(
      <ColegioDosExperience
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
    expect(screen.getAllByText(copy.demoNote).length).toBeGreaterThan(0);
    expect(templatePreviewHref("es", "colegio2", palette)).toContain(
      `primary=${encodeURIComponent(palette.primary)}`,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Comunidad" }));
    expect(screen.getByText("Puertas abiertas")).toBeInTheDocument();
    expect(screen.queryByText("Feria de ciencias")).not.toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: copy.cta })[2]!);
    expect(screen.getByLabelText(copy.levelLabel)).toHaveValue("media");
    expect(screen.getByRole("link", { name: copy.mailCta })).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:hola@example.com"),
    );
  });
});
