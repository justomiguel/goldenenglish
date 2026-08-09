import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { mockPathname, mockSearchParams } from "@/test/navigationMock";
import { PortalTopNav } from "@/components/portal/PortalTopNav";
import type { PortalDestination } from "@/lib/portal/portalShellTypes";

const BASE = "/es/dashboard/parent";

const DESTINATIONS: PortalDestination[] = [
  { id: "home", href: BASE, label: "Inicio", icon: "home" },
  {
    id: "progress",
    href: `${BASE}/progress`,
    label: "Progreso",
    icon: "progress",
    matchPrefixes: [`${BASE}/tasks`],
  },
  { id: "messages", href: `${BASE}/messages`, label: "Mensajes", icon: "messages" },
];

describe("PortalTopNav", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue(BASE);
    mockSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("names the navigation landmark and renders every destination", () => {
    render(<PortalTopNav destinations={DESTINATIONS} ariaLabel="Navegación principal" />);
    expect(screen.getByRole("navigation", { name: "Navegación principal" })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("marks the destination that owns a nested legacy route", () => {
    mockPathname.mockReturnValue(`${BASE}/tasks/abc`);
    render(<PortalTopNav destinations={DESTINATIONS} ariaLabel="Navegación principal" />);
    const current = screen.getAllByRole("link").filter((link) => link.getAttribute("aria-current"));
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAccessibleName("Progreso");
  });

  it("preserves the focus params across destinations", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("studentId=s3"));
    render(<PortalTopNav destinations={DESTINATIONS} ariaLabel="Navegación principal" />);
    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("href") ?? "").toContain("studentId=s3");
    }
  });
});
