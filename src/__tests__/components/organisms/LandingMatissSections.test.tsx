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
  it("shows the trial buttons, the groups, the FAQ, the contact form, and real photos", () => {
    const { container } = render(
      <LandingMatissSections
        dict={es}
        brand={brand}
        locale="es"
        links={[]}
        images={{
          heroWeb: "/images/matiss/fotos/roja.jpg",
          manifesto: "/images/matiss/fotos/acompanar.jpg",
          benefits: "/images/matiss/fotos/pequena.jpg",
          programs: ["/images/matiss/fotos/sentada.jpg", "/images/matiss/fotos/grande.jpg", "/images/matiss/fotos/lila.jpg"],
          classes: ["/images/matiss/fotos/clase-brazos.jpg"],
          gala: "/images/matiss/galeria/1.jpg",
          gallery: ["/images/matiss/galeria/2.jpg", "/images/matiss/fotos/clase-profe.jpg"],
          contact: "/images/matiss/galeria/3.jpg",
        }}
        publicCtaMode="trial"
        inscriptionsEnabled
      />,
    );

    expect(screen.getByRole("link", { name: es.landing.matiss.hero.ctaPrimary })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: es.landing.matiss.cta.button }).length).toBeGreaterThan(0);
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "+56 9 8747 6023" })).toHaveAttribute(
      "href",
      "tel:+56987476023",
    );
    expect(screen.getByRole("heading", { name: es.landing.matiss.manifiesto.title })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: es.landing.matiss.faq.title })).toBeInTheDocument();
    expect(screen.getByText(es.landing.matiss.faq.items[0].q)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: es.landing.matiss.programas.groups["senior-san-miguel"].name })).toBeInTheDocument();
    expect(screen.getAllByText(/19:00–20:00/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: es.publicContact.submit })).toBeInTheDocument();
    expect(screen.getByLabelText(es.publicContact.fullName)).toBeInTheDocument();
    expect(container.innerHTML).toContain("/images/matiss/fotos/roja.jpg");
    expect(container.innerHTML).toContain("/images/matiss/galeria/1.jpg");
    expect(container.innerHTML).not.toContain("galeria/4");
    expect(container.innerHTML).not.toContain("personajes");
  });
});
