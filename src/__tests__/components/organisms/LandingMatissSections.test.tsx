import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import es from "@/dictionaries/es.json";
import type { BrandPublic } from "@/lib/brand/server";
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
    render(
      <LandingMatissSections
        dict={es}
        brand={brand}
        locale="es"
        links={[]}
        images={{
          heroWeb: "/images/matiss/ilustraciones/og.jpg",
          about: "/images/matiss/galeria/3.jpg",
          classes: ["/images/matiss/ilustraciones/clase-1.jpg"],
          gallery: ["/images/matiss/galeria/1.jpg"],
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
  });
});
