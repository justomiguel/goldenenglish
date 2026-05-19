/**
 * REGRESSION CHECK: Marketing tenant headers (Mozarthitos / EspacioZenit / Nago)
 * must expose Sign In / Dashboard CTAs **without** opening the mobile drawer in
 * PWA / web-mobile widths. Drawer must also include an "Account" section so the
 * user has a redundant pathway. Origin: PWA polish 2026-05.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";
import { MozarthitosSiteHeader } from "@/components/organisms/MozarthitosSiteHeader";
import { EspacioZenitSiteHeader } from "@/components/organisms/EspacioZenitSiteHeader";
import { NagoSiteHeader } from "@/components/organisms/NagoSiteHeader";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
  }),
}));

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

describe("tenant landing headers — PWA visibility", () => {
  describe("MozarthitosSiteHeader", () => {
    it("renders Sign In CTA when logged out (visible without opening drawer)", () => {
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
      const loginLinks = screen.getAllByRole("link", { name: dictEn.nav.login });
      expect(loginLinks.length).toBeGreaterThan(0);
      expect(loginLinks[0]).toHaveAttribute("href", "/es/login");
    });

    it("renders Dashboard CTA + drawer Account section when logged in", async () => {
      const user = userEvent.setup();
      render(
        <MozarthitosSiteHeader
          locale="es"
          logoSrc="/images/logo.png"
          logoAlt="Logo"
          logoWidth={120}
          logoHeight={40}
          dict={dictEn}
          sessionEmail="a@b.co"
          labels={mzLabels}
        />,
      );
      expect(
        screen.getAllByRole("link", { name: dictEn.nav.administration }).length,
      ).toBeGreaterThan(0);
      await user.click(screen.getByRole("button", { name: mzLabels.openMenu }));
      expect(
        screen.getAllByRole("button", { name: dictEn.nav.logout }).length,
      ).toBeGreaterThan(0);
    });
  });

  describe("EspacioZenitSiteHeader", () => {
    it("renders Sign In CTA when logged out", () => {
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
      const loginLinks = screen.getAllByRole("link", { name: dictEn.nav.login });
      expect(loginLinks.length).toBeGreaterThan(0);
      expect(loginLinks[0]).toHaveAttribute("href", "/es/login");
    });

    it("includes Account section in mobile drawer when logged in", async () => {
      const user = userEvent.setup();
      render(
        <EspacioZenitSiteHeader
          locale="es"
          logoSrc="/images/logo.png"
          logoAlt="Logo"
          brandDisplayName="Test Institute"
          dict={dictEn}
          sessionEmail="a@b.co"
        />,
      );
      await user.click(
        screen.getByRole("button", {
          name: dictEn.landing.ez.chrome.openMenu,
        }),
      );
      expect(
        screen.getAllByRole("link", { name: dictEn.nav.administration }).length,
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByRole("button", { name: dictEn.nav.logout }).length,
      ).toBeGreaterThan(0);
    });
  });

  describe("NagoSiteHeader", () => {
    it("renders Sign In CTA when logged out", () => {
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
      const loginLinks = screen.getAllByRole("link", { name: dictEn.nav.login });
      expect(loginLinks.length).toBeGreaterThan(0);
      expect(loginLinks[0]).toHaveAttribute("href", "/es/login");
    });

    it("includes Account section with Dashboard + SignOut when logged in", async () => {
      const user = userEvent.setup();
      void mockBrandPublic;
      render(
        <NagoSiteHeader
          locale="es"
          logoSrc="/images/logo.png"
          logoAlt="Logo"
          dict={dictEn}
          sessionEmail="a@b.co"
          labels={nagoLabels}
        />,
      );
      expect(
        screen.getAllByRole("link", { name: dictEn.nav.administration }).length,
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByRole("button", { name: dictEn.nav.logout }).length,
      ).toBeGreaterThan(0);
      await user.click(
        screen.getByRole("button", { name: nagoLabels.openMenu }),
      );
      expect(
        screen.getAllByRole("button", { name: dictEn.nav.logout }).length,
      ).toBeGreaterThan(1);
    });
  });
});
