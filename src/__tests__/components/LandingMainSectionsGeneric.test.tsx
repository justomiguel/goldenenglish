import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingMainSectionsGeneric } from "@/components/organisms/LandingMainSectionsGeneric";

const copy = {
  name: "Deportes",
  scene: "Sábado, 9:10",
  title: "El grupo ya está en la cancha cuando llegas.",
  body: "La lista del día y el aviso a las familias quedan en el mismo lugar.",
  imageAlt: "Cancha por la mañana",
  laterTitle: "El lunes la planilla ya no hace falta.",
  laterBody: "Quien entrena ve quién vino.",
  cta: "Escribir al instituto",
};

describe("LandingMainSectionsGeneric", () => {
  it("renders the template story and the stock hero", () => {
    render(<LandingMainSectionsGeneric copy={copy} locale="es" kind="deportes" />);
    expect(screen.getByRole("heading", { level: 1, name: copy.title })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: copy.imageAlt })).toHaveAttribute(
      "src",
      "/generic/deportes/inicio.jpg",
    );
    expect(screen.getByRole("img", { name: "historia" })).toHaveAttribute(
      "src",
      "/generic/deportes/historia.jpg",
    );
    expect(screen.getByRole("link", { name: copy.cta })).toHaveAttribute("href", "/es/contact");
  });

  it("shows the image the admin saved for Inicio", () => {
    render(
      <LandingMainSectionsGeneric
        copy={copy}
        locale="es"
        kind="deportes"
        heroSrc="/images/academia-sur/og.png"
      />,
    );
    expect(screen.getByRole("img", { name: copy.imageAlt })).toHaveAttribute(
      "src",
      "/images/academia-sur/og.png",
    );
  });
});
