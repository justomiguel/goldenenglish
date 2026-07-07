import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MiMundoInstitucionalSection } from "@/components/organisms/MiMundoInstitucionalSection";
import { MiMundoColoniaSection } from "@/components/organisms/MiMundoColoniaSection";
import { dictEn } from "@/test/dictEn";

describe("MiMundoInstitucionalSection", () => {
  it("renders institutional copy from dictionary", () => {
    render(<MiMundoInstitucionalSection dict={dictEn} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      dictEn.landing.mm.institucional.title,
    );
    expect(screen.getByText(dictEn.landing.mm.institucional.highlight1)).toBeInTheDocument();
  });
});

describe("MiMundoColoniaSection", () => {
  it("renders summer camp copy and register CTA", () => {
    render(<MiMundoColoniaSection dict={dictEn} locale="es" />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      dictEn.landing.mm.colonia.title,
    );
    expect(screen.getByRole("link", { name: dictEn.landing.mm.colonia.cta })).toHaveAttribute(
      "href",
      "/es/register",
    );
  });
});
