import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import type { BrandPublic } from "@/lib/brand/server";
import { LandingMatissPhoneSections } from "@/components/organisms/LandingMatissPhoneSections";

vi.mock("@/app/[locale]/contact/actions", () => ({
  submitPublicContactForm: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/lib/analytics/trackClient", () => ({
  trackEvent: vi.fn(),
}));

const brand = {
  name: "Matiss Studio",
  logoPath: "/images/matiss/logo/logo.png",
  logoAlt: "Matiss Studio",
  contactPhone: "+56 9 8747 6023",
  contactEmail: "valentinatapiacarrasco@gmail.com",
  socialWhatsapp: "https://wa.me/56987476023",
} as BrandPublic;

const photos = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `/images/matiss/certificaciones/${n}.jpg`);

describe("LandingMatissPhoneSections", () => {
  it("gives each section one snap screen and keeps the age finder outside the groups", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <LandingMatissPhoneSections
        dict={es}
        brand={brand}
        locale="es"
        links={[]}
        images={{
          heroWeb: "/images/matiss/fotos/roja.jpg",
          manifesto: "/images/matiss/fotos/acompanar.jpg",
          benefits: "/images/matiss/fotos/pequena.jpg",
          programs: ["/images/matiss/fotos/sentada.jpg", "/images/matiss/fotos/grande.jpg"],
          classes: ["/images/matiss/fotos/clase-brazos.jpg"],
          gala: "/images/matiss/galeria/1.jpg",
          gallery: photos,
          contact: "/images/matiss/galeria/3.jpg",
        }}
      />,
    );

    const screens = container.querySelectorAll(".matiss-phone-screen");
    expect(screens).toHaveLength(12);
    expect(container.querySelector(".matiss-phone-scroll")).toBeTruthy();
    expect(container.querySelector("#clases")?.contains(container.querySelector("#horarios"))).toBe(false);
    expect(screens[11]?.querySelector("#contacto")).toBeTruthy();
    expect(screens[11]?.querySelector("footer")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: es.landing.matiss.galeria.alt })).toHaveLength(4);

    expect(screen.getByText(es.landing.matiss.faq.items[0].a)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: es.landing.matiss.faq.items[1].q }));
    expect(screen.queryByText(es.landing.matiss.faq.items[0].a)).toBeNull();
    expect(screen.getByText(es.landing.matiss.faq.items[1].a)).toBeTruthy();
  });
});
