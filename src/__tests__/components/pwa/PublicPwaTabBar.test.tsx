import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PublicPwaTabBar } from "@/components/pwa/molecules/PublicPwaTabBar";
import { mockPathname } from "@/test/navigationMock";

const labels = {
  home: "Inicio",
  courses: "Cursos",
  events: "Eventos",
  enroll: "Inscribirse",
  shop: "Tienda",
  blog: "Blog",
  aria: "Sitio público",
};

function renderBar(
  overrides: Partial<ComponentProps<typeof PublicPwaTabBar>> = {},
) {
  return render(
    <PublicPwaTabBar
      locale="es"
      sessionEmail={null}
      coursesHref="/es#niveles"
      coursesLabel="Cursos"
      labels={labels}
      loginLabel="Ingresar"
      portalLabel="Mi Portal"
      {...overrides}
    />,
  );
}

describe("PublicPwaTabBar", () => {
  it("sends a logged-out visitor to sign in and enroll", () => {
    mockPathname.mockReturnValue("/es");
    renderBar();

    expect(screen.getByRole("link", { name: "Ingresar" })).toHaveAttribute("href", "/es/login");
    expect(screen.getByRole("link", { name: "Inscribirse" })).toHaveAttribute("href", "/es/register");
    expect(screen.queryByRole("link", { name: "Mi Portal" })).toBeNull();
    expect(screen.getByRole("navigation", { name: "Sitio público" })).toHaveAttribute(
      "data-variant",
      "default",
    );
  });

  it("sends a logged-in visitor to the portal and the shop", () => {
    mockPathname.mockReturnValue("/es/events");
    renderBar({
      sessionEmail: "parent@example.test",
      merchEnabled: true,
      variant: "nago",
    });

    expect(screen.getByRole("link", { name: "Mi Portal" })).toHaveAttribute("href", "/es/dashboard");
    expect(screen.getByRole("link", { name: "Tienda" })).toHaveAttribute("href", "/es/tienda");
    expect(screen.queryByRole("link", { name: "Inscribirse" })).toBeNull();
    expect(screen.getByRole("link", { name: "Eventos" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("navigation", { name: "Sitio público" })).toHaveAttribute(
      "data-variant",
      "nago",
    );
  });
});
