import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";

vi.mock("@/components/molecules/SignOutButton", () => ({
  SignOutButton: () => <button type="button">logout</button>,
}));

import { MatissSiteHeader } from "@/variants/owned/matiss/header/v1/Web";

describe("MatissSiteHeader", () => {
  it("shows the horizontal lockup linked to the home page, not the round logo", () => {
    const { container } = render(
      <MatissSiteHeader
        locale="es"
        brandName="Matiss Studio"
        logoAlt="Matiss Studio"
        dict={es}
        sessionEmail={null}
        links={[{ href: "/es#sobre", label: "El estudio" }]}
        openMenu="Abrir menú"
        closeMenu="Cerrar menú"
      />,
    );

    expect(screen.getByRole("link", { name: "Matiss Studio" })).toHaveAttribute("href", "/es");
    expect(screen.getByText("Studio")).toBeInTheDocument();
    expect(container.querySelector("header img")).toBeNull();
    expect(container.querySelector("header")?.className).toContain("sticky");
  });

  it("uses a fixed header when the phone tree asks for it", () => {
    const { container } = render(
      <MatissSiteHeader
        locale="es"
        brandName="Matiss Studio"
        logoAlt="Matiss Studio"
        dict={es}
        sessionEmail={null}
        links={[]}
        openMenu="Abrir menú"
        closeMenu="Cerrar menú"
        placement="fixed"
      />,
    );

    const header = container.querySelector("header");
    expect(header?.className).toContain("fixed");
    expect(header?.className).not.toContain("sticky");
  });
});
