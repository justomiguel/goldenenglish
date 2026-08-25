import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";

describe("AdminPageHeader", () => {
  it("renders a primary display title, not the accent secondary", () => {
    const { container } = render(<AdminPageHeader title="Alumnos" lead="Hoy" iconId="students" />);
    const heading = screen.getByRole("heading", { name: "Alumnos" });
    expect(heading.className).toContain("--color-primary");
    expect(heading.className).not.toContain("--color-secondary");
    expect(container.querySelector("svg")).not.toBeNull();
    expect(screen.getByText("Hoy")).toBeInTheDocument();
    expect(screen.getByTestId("admin-page-header-art")).toHaveAttribute("aria-hidden");
    expect(screen.getByRole("banner").className).toContain("rounded-3xl");
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "/images/dashboard/admin-hero-students.webp",
    );
  });

  it("uses a different cutout for teachers than for students", () => {
    const { container } = render(<AdminPageHeader title="Profesores" iconId="teachers" />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "/images/dashboard/admin-hero-teachers.webp",
    );
  });

  it("places actions and the tour anchor on the header", () => {
    render(
      <AdminPageHeader
        title="Mensajes"
        tourAnchor="admin-messages-title"
        actions={<button type="button">Nuevo</button>}
      />,
    );
    expect(screen.getByRole("banner")).toHaveAttribute("data-tour", "admin-messages-title");
    expect(screen.getByRole("button", { name: "Nuevo" })).toBeInTheDocument();
  });
});
