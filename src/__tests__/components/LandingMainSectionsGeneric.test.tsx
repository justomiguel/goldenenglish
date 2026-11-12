import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingMainSectionsGeneric } from "@/components/organisms/LandingMainSectionsGeneric";
import { genericLandingComposition } from "@/lib/landing/genericLandingComposition";
import type { GenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import es from "@/dictionaries/es.json";

const copy = es.landing.genericLandings.deportes;
const nav = es.landing.genericNav;
const menu = es.landing.templateNav;
const labels = es.landing.genericSectionLabels;

async function renderLanding(
  props: Partial<ComponentProps<typeof LandingMainSectionsGeneric>> = {},
) {
  return render(
    await LandingMainSectionsGeneric({
      copy,
      locale: "es",
      kind: "deportes",
      nav,
      menu,
      sectionLabels: labels,
      ...props,
    }),
  );
}

describe("LandingMainSectionsGeneric", () => {
  it("renders the template story and the stock hero", async () => {
    await renderLanding();
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
    expect(screen.getByRole("link", { name: copy.cta })).toHaveAttribute("href", "#contacto");
    for (const id of ["inicio", "historia", "oferta", "modalidades", "niveles", "certificaciones", "contacto"]) {
      expect(document.getElementById(id)).toBeTruthy();
    }
    expect(screen.queryByRole("button", { name: nav.openMenu })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: menu.inicio })).toHaveAttribute("href", "#inicio");
    expect(screen.getByRole("link", { name: menu.historia })).toHaveAttribute("href", "#historia");
    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href") ?? "");
    expect(hrefs.join(" ")).not.toMatch(/\/(login|events|blog|tienda|contact|dashboard|register)/);
    expect(screen.queryByTitle(es.landing.genericContact.mapTitle)).not.toBeInTheDocument();
    expect(document.querySelector("[data-hero-layout]")).toHaveAttribute("data-hero-layout", "bleed");
  });

  it("shows the image the admin saved for Inicio", async () => {
    await renderLanding({ heroSrc: "/images/academia-sur/og.png" });
    expect(screen.getByRole("img", { name: copy.imageAlt })).toHaveAttribute(
      "src",
      "/images/academia-sur/og.png",
    );
  });

  it("omits a section the admin hid", async () => {
    await renderLanding({ hiddenSections: new Set(["historia", "niveles"]) });
    expect(screen.queryByRole("link", { name: menu.historia })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: menu.niveles })).not.toBeInTheDocument();
    expect(document.getElementById("historia")).toBeNull();
    expect(document.getElementById("niveles")).toBeNull();
    expect(screen.queryByRole("img", { name: copy.sections.historia })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: copy.sections.oferta })).toBeInTheDocument();
  });

  it("shows the map and the contact form when the site has an address", async () => {
    await renderLanding({
      contact: {
        email: "ana@example.com",
        phone: "",
        address: "Calle 1",
        whatsapp: "5491122334455",
        instagram: "club",
        facebook: "",
      },
      contactLabels: es.landing.genericContact,
    });
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
    expect(screen.getByRole("link", { name: copy.cta })).toHaveAttribute("href", "#contacto");
  });

  it("gives each kind its own composition", () => {
    const kinds: GenericInstituteKind[] = ["deportes", "jardin", "colegio", "musica", "idiomas"];
    const heroes = kinds.map((kind) => genericLandingComposition(kind).hero);
    expect(new Set(heroes).size).toBe(kinds.length);
  });
});
