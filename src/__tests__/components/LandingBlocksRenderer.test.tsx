import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingBlocksRenderer } from "@/components/organisms/LandingBlocksRenderer";
import type { LandingBlock } from "@/types/theming";

function makeBlock(partial: Partial<LandingBlock> & { id: string }): LandingBlock {
  return {
    id: partial.id,
    section: partial.section ?? "inicio",
    kind: partial.kind ?? "card",
    position: partial.position ?? 1,
    copy: partial.copy ?? {
      es: { title: "Hola", body: "Cuerpo" },
      en: { title: "Hello", body: "Body" },
    },
    mediaPath: partial.mediaPath,
  };
}

describe("LandingBlocksRenderer", () => {
  it("returns null when there are no blocks", () => {
    const { container } = render(
      <LandingBlocksRenderer section="inicio" blocks={[]} locale="es" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders English copy when locale starts with 'en'", () => {
    render(
      <LandingBlocksRenderer
        section="inicio"
        blocks={[makeBlock({ id: "b1" })]}
        locale="en"
      />,
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("falls back to the alternate locale when the primary is empty", () => {
    render(
      <LandingBlocksRenderer
        section="historia"
        blocks={[
          makeBlock({
            id: "b1",
            copy: {
              es: { title: "Solo ES" },
              en: {},
            },
          }),
        ]}
        locale="en"
      />,
    );
    expect(screen.getByText("Solo ES")).toBeInTheDocument();
  });

  it("skips blocks without title or body in either locale", () => {
    const { container } = render(
      <LandingBlocksRenderer
        section="inicio"
        blocks={[
          makeBlock({
            id: "empty",
            copy: { es: {}, en: {} },
          }),
        ]}
        locale="es"
      />,
    );
    expect(container.querySelectorAll("article")).toHaveLength(0);
  });

  it("renders a quote block as a <blockquote> with attribution", () => {
    render(
      <LandingBlocksRenderer
        section="inicio"
        blocks={[
          makeBlock({
            id: "q1",
            kind: "quote",
            copy: {
              es: { title: "Estudiante", body: "Aprendí muchísimo." },
              en: {},
            },
          }),
        ]}
        locale="es"
      />,
    );
    const quote = screen.getByText(/Aprendí muchísimo/);
    expect(quote.tagName).toBe("P");
    expect(quote.closest("blockquote")).not.toBeNull();
    expect(screen.getByText(/Estudiante/)).toBeInTheDocument();
  });

  it("renders a stat block with title as the prominent value", () => {
    render(
      <LandingBlocksRenderer
        section="inicio"
        blocks={[
          makeBlock({
            id: "s1",
            kind: "stat",
            copy: {
              es: { title: "98%", body: "Estudiantes aprobados" },
              en: {},
            },
          }),
        ]}
        locale="es"
      />,
    );
    expect(screen.getByText("98%")).toBeInTheDocument();
    expect(screen.getByText("Estudiantes aprobados")).toBeInTheDocument();
  });

  it("renders a divider block with a centered title", () => {
    render(
      <LandingBlocksRenderer
        section="inicio"
        blocks={[
          makeBlock({
            id: "d1",
            kind: "divider",
            copy: { es: { title: "Más abajo" }, en: {} },
          }),
        ]}
        locale="es"
      />,
    );
    expect(screen.getByText("Más abajo")).toBeInTheDocument();
  });

  it("renders feature, cta and divider blocks as full-width spans", () => {
    const { container } = render(
      <LandingBlocksRenderer
        section="inicio"
        blocks={[
          makeBlock({ id: "f1", kind: "feature", copy: { es: { title: "F" }, en: {} } }),
          makeBlock({ id: "c1", kind: "cta", copy: { es: { title: "C" }, en: {} } }),
          makeBlock({ id: "d1", kind: "divider", copy: { es: { title: "D" }, en: {} } }),
          makeBlock({ id: "k1", kind: "card", copy: { es: { title: "K" }, en: {} } }),
        ]}
        locale="es"
      />,
    );
    const wrappers = container.querySelectorAll("[data-landing-blocks] > div");
    expect(wrappers).toHaveLength(4);
    expect(wrappers[0]?.className).toContain("sm:col-span-2");
    expect(wrappers[1]?.className).toContain("sm:col-span-2");
    expect(wrappers[2]?.className).toContain("sm:col-span-2");
    expect(wrappers[3]?.className).not.toContain("sm:col-span-2");
  });
});
