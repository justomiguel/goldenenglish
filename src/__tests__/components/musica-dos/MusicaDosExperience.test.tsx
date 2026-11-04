import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MusicaDosExperience } from "@/components/organisms/musica-dos/MusicaDosExperience";
import es from "@/dictionaries/es.json";
import { genericKindDefaultPalette } from "@/lib/theme/genericInstituteTemplates";
import { templatePreviewHref } from "@/lib/theme/templatePalette";

vi.mock("@/app/[locale]/contact/freeSiteContactAction", () => ({
  submitGenericLandingContactAction: vi.fn(async () => ({ ok: false, errorCode: "preview" })),
}));

const copy = es.landing.genericLandings.musica2;

describe("MusicaDosExperience", () => {
  it("filters a class and marks the chosen instrument", async () => {
    const palette = genericKindDefaultPalette("musica2");
    render(
      <MusicaDosExperience
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
    expect(screen.getByText(copy.demoNote)).toBeInTheDocument();
    expect(templatePreviewHref("es", "musica2", palette)).toContain(
      `primary=${encodeURIComponent(palette.primary)}`,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Batería" }));
    expect(screen.getByText("Batería inicial")).toBeInTheDocument();
    expect(screen.queryByText("Piano intermedio")).not.toBeInTheDocument();
    const row = screen.getAllByText("Batería inicial").find((node) => node.tagName === "P");
    await user.click(within(row?.closest("li") as HTMLElement).getByRole("button", { name: copy.cta }));
    expect(screen.getByLabelText(copy.instrumentLabel)).toHaveValue("bateria");
    expect(screen.getByRole("link", { name: copy.mailCta })).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:hola@example.com"),
    );
  });
});
