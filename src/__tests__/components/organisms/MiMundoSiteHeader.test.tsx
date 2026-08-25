import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { dictEn } from "@/test/dictEn";
import { MiMundoSiteHeader } from "@/components/organisms/MiMundoSiteHeader";

const labels = {
  institucional: "Institucional",
  colonia: "Colonia",
  propuesta: "Propuesta",
  salas: "Salas",
  galeria: "Galería",
  contacto: "Contacto",
  openMenu: "Abrir menú",
  closeMenu: "Cerrar menú",
  login: "Entrar",
  reservar: "Reservar",
};

describe("MiMundoSiteHeader", () => {
  it("omits Inicio, Eventos and Blog so the top nav stays uncrowded", () => {
    render(
      <MiMundoSiteHeader
        locale="es"
        logoSrc="/images/mimundo/logo/logo.png"
        logoAlt="Mi Mundo"
        dict={dictEn}
        sessionEmail={null}
        labels={labels}
      />,
    );

    const nav = screen.getByRole("navigation", { name: dictEn.nav.sectionsAria });
    const hrefs = Array.from(nav.querySelectorAll("a")).map((a) =>
      a.getAttribute("href"),
    );

    expect(hrefs).toEqual([
      "/es#institucional",
      "/es#colonia",
      "/es#propuesta",
      "/es#salas",
      "/es#galeria",
      "/es#contacto",
    ]);
    expect(screen.queryByRole("link", { name: /inicio|blog|eventos/i })).toBeNull();
  });

  it("keeps signed-in admin actions in the menu so the top bar stays one row", () => {
    render(
      <MiMundoSiteHeader
        locale="es"
        logoSrc="/images/mimundo/logo/logo.png"
        logoAlt="Mi Mundo"
        dict={dictEn}
        sessionEmail="admin@example.test"
        labels={labels}
      />,
    );

    const adminLinks = screen.getAllByRole("link", { name: dictEn.nav.administration });
    expect(adminLinks.length).toBeGreaterThanOrEqual(1);
    for (const link of adminLinks) {
      expect(link.className.split(/\s+/)).toContain("md:inline-flex");
    }
  });
});
