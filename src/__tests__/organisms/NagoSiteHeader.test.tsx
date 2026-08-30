import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { dictEn } from "@/test/dictEn";
import { mockPathname } from "@/test/navigationMock";
import { NagoSiteHeader } from "@/components/organisms/NagoSiteHeader";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
  }),
}));

const labels = {
  inicio: "Inicio",
  clases: "Clases",
  horarios: "Horarios",
  nago: "Nagô",
  galeria: "Galería",
  eventos: "Eventos",
  contacto: "Contacto",
  agendaCta: "Agenda tu clase",
  openMenu: "Abrir menú",
  closeMenu: "Cerrar menú",
};

function renderHeader() {
  return render(
    <NagoSiteHeader
      locale="es"
      logoSrc="/images/logo.png"
      logoAlt="Capoeira Nagô"
      dict={dictEn}
      sessionEmail={null}
      labels={labels}
    />,
  );
}

describe("NagoSiteHeader", () => {
  it("stays pinned to the viewport while sections scroll", () => {
    const { container } = renderHeader();
    const header = container.querySelector("header");
    expect(header).toHaveClass("fixed", "top-0");
    expect(header).not.toHaveClass("sticky");
    expect(container.querySelector(".nago-site-header-spacer")).toBeTruthy();
  });

  it("renders the logo without a cream plate", () => {
    renderHeader();
    const logo = screen.getByRole("link", { name: "Capoeira Nagô" });
    expect(logo.className).not.toMatch(/nago-heading-solid/);
  });

  it("keeps the mobile menu as a sliding panel in the DOM", async () => {
    const user = userEvent.setup();
    const { container } = renderHeader();
    const drawer = container.querySelector("#nago-mobile-nav");
    expect(drawer).toBeTruthy();
    expect(drawer).toHaveClass("nago-mobile-drawer");
    expect(drawer).toHaveAttribute("aria-hidden", "true");

    await user.click(screen.getByRole("button", { name: labels.openMenu }));
    expect(drawer).toHaveClass("is-open");
    expect(drawer).toHaveAttribute("aria-hidden", "false");
  });

  it("marks Eventos as the current page on the events route", async () => {
    mockPathname.mockReturnValue("/es/events");
    renderHeader();
    const events = screen.getByRole("link", { name: labels.eventos });
    await waitFor(() => {
      expect(events).toHaveAttribute("aria-current", "page");
    });
    expect(events).toHaveClass("is-active");
  });
});
