import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingMainSectionsGeneric } from "@/components/organisms/LandingMainSectionsGeneric";
import { genericLandingComposition } from "@/lib/landing/genericLandingComposition";
import type { GenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import es from "@/dictionaries/es.json";

const copy = es.landing.genericLandings.deportes;

describe("LandingMainSectionsGeneric", () => {
  it("renders the template story and the stock hero", () => {
    render(<LandingMainSectionsGeneric copy={copy} locale="es" kind="deportes" />);
    expect(screen.getByRole("heading", { level: 1, name: copy.title })).toBeInTheDocument();
    expect(screen.getByText(copy.rhythmA.replace(/^\d{1,2}:\d{2}\.\s+/, ""))).toBeInTheDocument();
    expect(screen.getByRole("img", { name: copy.imageAlt })).toHaveAttribute(
      "src",
      "/generic/deportes/inicio.jpg",
    );
    expect(screen.getByRole("img", { name: copy.sections.historia })).toHaveAttribute(
      "src",
      "/generic/deportes/historia.jpg",
    );
    expect(screen.getByRole("link", { name: copy.cta })).toHaveAttribute("href", "/es/contact");
    expect(screen.queryByTitle(es.landing.genericContact.mapTitle)).not.toBeInTheDocument();
    expect(document.querySelector("[data-hero-layout]")).toHaveAttribute("data-hero-layout", "bleed");
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

  it("omits a section the admin hid", () => {
    render(
      <LandingMainSectionsGeneric
        copy={copy}
        locale="es"
        kind="deportes"
        hiddenSections={new Set(["historia"])}
      />,
    );
    expect(screen.queryByRole("img", { name: copy.sections.historia })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: copy.sections.oferta })).toBeInTheDocument();
  });

  it("shows the map and the contact form when the site has an address", () => {
    render(
      <LandingMainSectionsGeneric
        copy={copy}
        locale="es"
        kind="deportes"
        contact={{
          email: "ana@example.com",
          phone: "",
          address: "Calle 1",
          whatsapp: "5491122334455",
          instagram: "club",
          facebook: "",
        }}
        contactLabels={es.landing.genericContact}
      />,
    );
    expect(screen.getByTitle(es.landing.genericContact.mapTitle)).toHaveAttribute(
      "src",
      "https://maps.google.com/maps?q=Calle%201&z=16&output=embed",
    );
    expect(screen.getByRole("link", { name: es.landing.genericContact.instagram })).toHaveAttribute(
      "href",
      "https://instagram.com/club",
    );
    expect(screen.getByRole("link", { name: es.landing.genericContact.whatsapp })).toHaveAttribute(
      "href",
      "https://wa.me/5491122334455",
    );
    expect(screen.getByLabelText(es.landing.genericContact.formName)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.cta })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: copy.cta })).not.toBeInTheDocument();
  });

  it("gives each kind its own composition", () => {
    const kinds: GenericInstituteKind[] = ["deportes", "jardin", "colegio", "musica", "idiomas"];
    const heroes = kinds.map((kind) => genericLandingComposition(kind).hero);
    expect(new Set(heroes).size).toBe(kinds.length);
  });
});
