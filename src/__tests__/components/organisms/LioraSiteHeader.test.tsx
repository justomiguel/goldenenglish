import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";

vi.mock("@/components/molecules/SignOutButton", () => ({
  SignOutButton: () => <button type="button">logout</button>,
}));

import { LioraSiteHeader } from "@/components/organisms/LioraSiteHeader";

type IoCallback = (entries: Array<{ isIntersecting: boolean }>) => void;
let observerCallback: IoCallback | null = null;

beforeEach(() => {
  observerCallback = null;
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: IoCallback) {
        observerCallback = cb;
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const labels = {
  inicio: "Inicio",
  sobreNosotros: "Sobre nosotros",
  clases: "Clases",
  sedes: "Sedes",
  horarios: "Horarios",
  galeria: "Galería",
  eventos: "Eventos",
  contacto: "Contacto",
  openMenu: "Abrir menú",
  closeMenu: "Cerrar menú",
};

function renderHeader() {
  return render(
    <LioraSiteHeader
      locale="es"
      brandName="Liora Studio"
      logoAlt="Liora Studio"
      dict={es}
      sessionEmail={null}
      labels={labels}
    />,
  );
}

describe("LioraSiteHeader", () => {
  it("shows the horizontal lockup with the motto instead of the square logo", () => {
    const { container } = renderHeader();
    expect(screen.getByRole("link", { name: "Liora Studio" })).toHaveAttribute("href", "/es");
    expect(screen.getByText("Danza · Movimiento · Pasión")).toBeInTheDocument();
    expect(container.querySelector("header img")).toBeNull();
    expect(container.querySelector("header")?.className).toContain("sticky");
  });

  it("turns compact and hides the motto after the page scrolls", () => {
    const { container } = renderHeader();
    const header = container.querySelector("header");
    expect(header).toHaveAttribute("data-scrolled", "false");
    act(() => observerCallback?.([{ isIntersecting: false }]));
    expect(header).toHaveAttribute("data-scrolled", "true");
    expect(container.querySelector("[data-lockup-motto]")).toHaveAttribute("aria-hidden", "true");
  });

  it("lets the lockup shrink so the menu button stays on narrow screens", () => {
    renderHeader();
    const home = screen.getByRole("link", { name: "Liora Studio" });
    expect(home.className).toContain("min-w-0");
    expect(home.className.split(/\s+/)).not.toContain("shrink-0");
    expect(screen.getByRole("button", { name: "Abrir menú" })).toBeInTheDocument();
  });

  it("leaves the account button to the tab bar below md", () => {
    renderHeader();
    const account = screen.getByRole("navigation", { name: es.nav.accountAria });
    expect(account.className.split(/\s+/)).toEqual(expect.arrayContaining(["hidden", "md:flex"]));
  });

  it("hides the motto below md", () => {
    const { container } = renderHeader();
    expect(container.querySelector("[data-lockup-motto]")?.className).toContain("max-md:hidden");
  });

  it("keeps the full nav for wide screens so the account button fits", () => {
    renderHeader();
    const sections = screen.getAllByRole("navigation", { name: es.nav.sectionsAria })[0];
    expect(sections.className.split(/\s+/)).toEqual(expect.arrayContaining(["hidden", "xl:flex"]));
    expect(screen.getByRole("button", { name: "Abrir menú" }).className).toContain("xl:hidden");
  });
});
