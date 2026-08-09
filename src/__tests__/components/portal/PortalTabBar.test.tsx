import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { mockPathname, mockSearchParams } from "@/test/navigationMock";
import { PortalTabBar } from "@/components/portal/PortalTabBar";
import type { PortalDestination } from "@/lib/portal/portalShellTypes";

const BASE = "/es/dashboard/parent";

const DESTINATIONS: PortalDestination[] = [
  { id: "home", href: BASE, label: "Inicio", icon: "home" },
  { id: "calendar", href: `${BASE}/calendar`, label: "Asistencias", icon: "calendar" },
  { id: "progress", href: `${BASE}/progress`, label: "Progreso", icon: "progress" },
  { id: "messages", href: `${BASE}/messages`, label: "Mensajes", icon: "messages" },
];

describe("PortalTabBar", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue(BASE);
    mockSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("names the navigation landmark", () => {
    render(<PortalTabBar destinations={DESTINATIONS} ariaLabel="Navegación de la app" />);
    expect(screen.getByRole("navigation", { name: "Navegación de la app" })).toBeInTheDocument();
  });

  it("renders one link per destination with its label", () => {
    render(<PortalTabBar destinations={DESTINATIONS} ariaLabel="Navegación de la app" />);
    expect(screen.getAllByRole("link")).toHaveLength(4);
    for (const destination of DESTINATIONS) {
      expect(screen.getByRole("link", { name: destination.label })).toBeInTheDocument();
    }
  });

  it("marks only the active destination with aria-current", () => {
    mockPathname.mockReturnValue(`${BASE}/calendar`);
    render(<PortalTabBar destinations={DESTINATIONS} ariaLabel="Navegación de la app" />);
    const current = screen.getAllByRole("link").filter((link) => link.getAttribute("aria-current"));
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAccessibleName("Asistencias");
  });

  it("carries studentId and sectionId onto every href", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("studentId=s2&sectionId=sec7"));
    render(<PortalTabBar destinations={DESTINATIONS} ariaLabel="Navegación de la app" />);
    for (const link of screen.getAllByRole("link")) {
      const href = link.getAttribute("href") ?? "";
      expect(href).toContain("studentId=s2");
      expect(href).toContain("sectionId=sec7");
    }
  });

  it("adds no query string when there is no focus in the URL", () => {
    render(<PortalTabBar destinations={DESTINATIONS} ariaLabel="Navegación de la app" />);
    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("href") ?? "").not.toContain("?");
    }
  });
});
