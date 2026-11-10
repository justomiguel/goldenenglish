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
});
