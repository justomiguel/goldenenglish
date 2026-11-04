import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PulsarPanelNavLinks } from "@/components/organisms/pulsar/PulsarPanelNavLinks";

describe("PulsarPanelNavLinks", () => {
  it("paints the new-tenant link as a primary button", () => {
    render(
      <PulsarPanelNavLinks
        label="Panel"
        pathname="/es/admin"
        tab="sites"
        items={[
          { id: "sites", href: "/es/admin?tab=sites", label: "Sitios" },
          { id: "new", href: "/es/admin/tenants/new", label: "Nuevo tenant" },
        ]}
      />,
    );
    const link = screen.getByRole("link", { name: "Nuevo tenant" });
    expect(link).toHaveAttribute("href", "/es/admin/tenants/new");
    expect(link.className).toContain("bg-[var(--color-primary)]");
    expect(link.className).toContain("text-[var(--color-primary-foreground)]");
  });
});
