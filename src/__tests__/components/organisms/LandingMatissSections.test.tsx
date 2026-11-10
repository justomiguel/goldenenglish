import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import type { BrandPublic } from "@/lib/brand/server";

vi.mock("@/app/[locale]/contact/actions", () => ({
  submitPublicContactForm: vi.fn().mockResolvedValue({ ok: true }),
}));

import { LandingMatissSections } from "@/components/organisms/LandingMatissSections";

const brand = {
  name: "Matiss Studio",
  logoPath: "/images/matiss/logo/logo.png",
  logoAlt: "Matiss Studio",
  contactPhone: "+56 9 8747 6023",
  contactEmail: "valentinatapiacarrasco@gmail.com",
  socialWhatsapp: "https://wa.me/56987476023",
} as BrandPublic;

describe("LandingMatissSections", () => {
  it("shows the trial button, the age control, and the phone", () => {
    const { container } = render(
      <LandingMatissSections
        dict={es}
        brand={brand}
        locale="es"
        links={[]}
        images={{
          heroWeb: "/images/matiss/personajes/pequena.jpg",
          manifesto: "/images/matiss/personajes/grupo.jpg",
          ageSmall: "/images/matiss/personajes/pequena.jpg",
          ageBig: "/images/matiss/personajes/grande.jpg",
          about: "/images/matiss/personajes/grande.jpg",
          classes: ["/images/matiss/ilustraciones/clase-1.jpg"],
          gallery: [
            "/images/matiss/personajes/pequena.jpg",
            "/images/matiss/personajes/grande.jpg",
            "/images/matiss/personajes/grupo.jpg",
          ],
        }}
        publicCtaMode="trial"
        inscriptionsEnabled
      />,
    );

    expect(screen.getAllByRole("link", { name: "Agenda una clase de prueba" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+56 9 8747 6023" })).toHaveAttribute(
      "href",
      "tel:+56987476023",
    );
    expect(screen.getByRole("heading", { name: "Más que enseñar, acompañar." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: es.publicContact.submit })).toBeInTheDocument();
    expect(screen.getByLabelText(es.publicContact.fullName)).toBeInTheDocument();
    expect(container.innerHTML).toContain("/images/matiss/personajes/pequena.jpg");
    expect(container.innerHTML).toContain("/images/matiss/personajes/grande.jpg");
    expect(container.innerHTML).not.toContain("galeria/4");
    expect(container.innerHTML).not.toContain("hero-pwa");
  });
});
