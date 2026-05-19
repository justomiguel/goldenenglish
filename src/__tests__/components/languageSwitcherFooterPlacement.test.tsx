/**
 * REGRESSION CHECK: The language selector lives in the **footer** for every
 * public landing surface (web desktop + PWA, all tenants). Headers must not
 * render the `<nav aria-label="Language">` bar. Origin: UX request 2026-05.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";
import { mockPathname } from "@/test/navigationMock";

import { LandingHeader } from "@/components/organisms/LandingHeader";
import { LandingGreenfieldHeader } from "@/components/organisms/LandingGreenfieldHeader";
import { MozarthitosSiteHeader } from "@/components/organisms/MozarthitosSiteHeader";
import { EspacioZenitSiteHeader } from "@/components/organisms/EspacioZenitSiteHeader";
import { NagoSiteHeader } from "@/components/organisms/NagoSiteHeader";
import { LandingHeaderPwa } from "@/components/pwa/molecules/LandingHeaderPwa";

import { LandingFooter } from "@/components/organisms/LandingFooter";
import { LandingFooterPwa } from "@/components/pwa/molecules/LandingFooterPwa";
import { LandingEspacioZenitFooter } from "@/components/organisms/LandingEspacioZenitFooter";
import { LandingGreenfieldFooter } from "@/components/organisms/LandingGreenfieldFooter";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
  }),
}));

const languageLabel = dictEn.common.locale.label;

const mzLabels = {
  inicio: "Inicio",
  quienes: "Quienes",
  cursos: "Cursos",
  sedes: "Sedes",
  contacto: "Contacto",
  openMenu: "Abrir menú",
  closeMenu: "Cerrar menú",
};

const nagoLabels = {
  inicio: "Inicio",
  sobreNosotros: "Sobre",
  clases: "Clases",
  galeria: "Galería",
  eventos: "Eventos",
  contacto: "Contacto",
  openMenu: "Abrir menú",
  closeMenu: "Cerrar menú",
};

describe("Language selector — footer-only across landings", () => {
  describe("Desktop headers must NOT render the language selector", () => {
    it("LandingHeader (default Golden English)", () => {
      mockPathname.mockReturnValue("/es");
      render(
        <LandingHeader
          brand={mockBrandPublic}
          dict={dictEn}
          locale="es"
          sessionEmail={null}
        />,
      );
      expect(
        screen.queryByRole("navigation", { name: languageLabel }),
      ).toBeNull();
    });

    it("LandingGreenfieldHeader (first-run)", () => {
      mockPathname.mockReturnValue("/es");
      render(
        <LandingGreenfieldHeader
          brand={mockBrandPublic}
          dict={dictEn}
          locale="es"
          sessionEmail={null}
        />,
      );
      expect(
        screen.queryByRole("navigation", { name: languageLabel }),
      ).toBeNull();
    });

    it("MozarthitosSiteHeader", () => {
      mockPathname.mockReturnValue("/es");
      render(
        <MozarthitosSiteHeader
          locale="es"
          logoSrc="/images/logo.png"
          logoAlt="Logo"
          logoWidth={120}
          logoHeight={40}
          dict={dictEn}
          sessionEmail={null}
          labels={mzLabels}
        />,
      );
      expect(
        screen.queryByRole("navigation", { name: languageLabel }),
      ).toBeNull();
    });

    it("EspacioZenitSiteHeader", () => {
      mockPathname.mockReturnValue("/es");
      render(
        <EspacioZenitSiteHeader
          locale="es"
          logoSrc="/images/logo.png"
          logoAlt="Logo"
          brandDisplayName="Test Institute"
          dict={dictEn}
          sessionEmail={null}
        />,
      );
      expect(
        screen.queryByRole("navigation", { name: languageLabel }),
      ).toBeNull();
    });

    it("NagoSiteHeader", () => {
      mockPathname.mockReturnValue("/es");
      render(
        <NagoSiteHeader
          locale="es"
          logoSrc="/images/logo.png"
          logoAlt="Logo"
          dict={dictEn}
          sessionEmail={null}
          labels={nagoLabels}
        />,
      );
      expect(
        screen.queryByRole("navigation", { name: languageLabel }),
      ).toBeNull();
    });
  });

  describe("PWA header must NOT render the language selector", () => {
    it("LandingHeaderPwa", () => {
      mockPathname.mockReturnValue("/es");
      render(
        <LandingHeaderPwa
          brand={mockBrandPublic}
          dict={dictEn}
          locale="es"
          sessionEmail={null}
        />,
      );
      expect(
        screen.queryByRole("navigation", { name: languageLabel }),
      ).toBeNull();
    });
  });

  describe("Footers must render the language selector with all three locales", () => {
    function expectAllLocaleLinks(navNode: HTMLElement) {
      const links = Array.from(navNode.querySelectorAll("a"));
      const hrefs = links.map((a) => a.getAttribute("href")).filter(Boolean);
      expect(hrefs).toEqual(
        expect.arrayContaining(["/es", "/en", "/pt"]),
      );
    }

    it("LandingFooter (shared marketing/GE shell)", () => {
      mockPathname.mockReturnValue("/es");
      render(
        <LandingFooter
          dict={dictEn}
          brand={mockBrandPublic}
          locale="es"
          sessionEmail={null}
        />,
      );
      const nav = screen.getByRole("navigation", { name: languageLabel });
      expect(nav).toBeInTheDocument();
      expectAllLocaleLinks(nav);
    });

    it("LandingFooterPwa (PWA shared)", () => {
      mockPathname.mockReturnValue("/es");
      render(
        <LandingFooterPwa
          dict={dictEn}
          brand={mockBrandPublic}
          locale="es"
          sessionEmail={null}
        />,
      );
      const nav = screen.getByRole("navigation", { name: languageLabel });
      expect(nav).toBeInTheDocument();
      expectAllLocaleLinks(nav);
    });

    it("LandingEspacioZenitFooter (EZ custom)", () => {
      mockPathname.mockReturnValue("/es");
      render(
        <LandingEspacioZenitFooter
          dict={dictEn}
          locale="es"
          logoSrc="/images/logo.png"
          logoAlt="Logo"
          brand={mockBrandPublic}
        />,
      );
      const nav = screen.getByRole("navigation", { name: languageLabel });
      expect(nav).toBeInTheDocument();
      expectAllLocaleLinks(nav);
    });

    it("LandingGreenfieldFooter (first-run)", () => {
      mockPathname.mockReturnValue("/es");
      render(
        <LandingGreenfieldFooter
          dict={dictEn}
          brand={mockBrandPublic}
          locale="es"
        />,
      );
      const nav = screen.getByRole("navigation", { name: languageLabel });
      expect(nav).toBeInTheDocument();
      expectAllLocaleLinks(nav);
    });
  });
});
