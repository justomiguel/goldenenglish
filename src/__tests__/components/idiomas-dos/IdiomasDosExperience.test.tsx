import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { IdiomasDosExperience } from "@/components/organisms/idiomas-dos/IdiomasDosExperience";
import es from "@/dictionaries/es.json";
import { genericKindDefaultPalette } from "@/lib/theme/genericInstituteTemplates";
import { templatePreviewHref } from "@/lib/theme/templatePalette";

vi.mock("@/app/[locale]/contact/freeSiteContactAction", () => ({
  submitGenericLandingContactAction: vi.fn(async () => ({ ok: false, errorCode: "preview" })),
}));

const copy = es.landing.genericLandings.idiomas2;

describe("IdiomasDosExperience", () => {
  it("changes the greeting, blocks an empty quiz step, and preselects a course", async () => {
    const palette = genericKindDefaultPalette("idiomas2");
    render(
      <IdiomasDosExperience
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
    expect(templatePreviewHref("es", "idiomas2", palette)).toContain(
      `accent=${encodeURIComponent(palette.accent)}`,
    );
    const user = userEvent.setup();
    await user.click(screen.getAllByRole("button", { name: "Francés" })[0]!);
    expect(screen.getByText("Bonjour")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: copy.quizNext }));
    expect(screen.getByText(copy.quizNeed)).toBeInTheDocument();
    const title = screen.getAllByText("Inglés de trabajo").find((node) => node.tagName === "P");
    const row = title?.closest("li");
    expect(row).toBeTruthy();
    await user.click(within(row as HTMLElement).getByRole("button", { name: copy.cta }));
    expect(screen.getByLabelText(copy.courseLabel)).toHaveValue("en-b1-vivo");
    expect(screen.getByRole("link", { name: copy.mailCta })).toHaveAttribute(
      "href",
      expect.stringContaining("mailto:hola@example.com"),
    );
  });
});
