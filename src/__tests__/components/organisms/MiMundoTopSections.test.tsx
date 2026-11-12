import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MiMundoInstitucionalSection } from "@/components/organisms/MiMundoInstitucionalSection";
import { MiMundoColoniaSection } from "@/components/organisms/MiMundoColoniaSection";
import { dictEn } from "@/test/dictEn";
import es from "@/dictionaries/es.json";
import pt from "@/dictionaries/pt.json";

// REGRESSION CHECK: Colony ages must stay 45 days to 5 years, the kindergarten range.

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
    expect(screen.getByText(/45 days/)).toBeInTheDocument();
    expect(screen.getByText(/5 years/)).toBeInTheDocument();
    expect(screen.queryByText(/3 to 12/)).not.toBeInTheDocument();
  });

  it("states the kindergarten age range in es and pt", () => {
    expect(es.landing.mm.colonia.bodyP2).toMatch(/45 días/);
    expect(es.landing.mm.colonia.bodyP2).toMatch(/5 años/);
    expect(es.landing.mm.colonia.bodyP2).not.toMatch(/3 a 12/);
    expect(pt.landing.mm.colonia.bodyP2).toMatch(/45 dias/);
    expect(pt.landing.mm.colonia.bodyP2).toMatch(/5 anos/);
    expect(pt.landing.mm.colonia.bodyP2).not.toMatch(/3 a 12/);
  });
});
