import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PublicHeaderAccountCta } from "@/components/molecules/PublicHeaderAccountCta";

describe("PublicHeaderAccountCta", () => {
  it("shows a visible sign-in link when the visitor is logged out", () => {
    render(
      <PublicHeaderAccountCta
        locale="es"
        sessionEmail={null}
        loginLabel="Ingresar"
        portalLabel="Mi Portal"
        logoutLabel="Cerrar Sesión"
      />,
    );

    const login = screen.getByRole("link", { name: "Ingresar" });
    expect(login).toHaveAttribute("href", "/es/login");
    expect(login.className).not.toMatch(/\bsr-only\b/);
    expect(login.className).not.toMatch(/\bhidden\b/);
    expect(screen.queryByRole("link", { name: "Mi Portal" })).toBeNull();
  });

  it("shows a visible portal link when the visitor is logged in", () => {
    render(
      <PublicHeaderAccountCta
        locale="es"
        sessionEmail="parent@example.test"
        loginLabel="Ingresar"
        portalLabel="Mi Portal"
        logoutLabel="Cerrar Sesión"
      />,
    );

    const portal = screen.getByRole("link", { name: "Mi Portal" });
    expect(portal).toHaveAttribute("href", "/es/dashboard");
    expect(portal.className).not.toMatch(/\bsr-only\b/);
    expect(portal.className).not.toMatch(/\bhidden\b/);
    expect(screen.queryByRole("link", { name: "Ingresar" })).toBeNull();
  });
});
