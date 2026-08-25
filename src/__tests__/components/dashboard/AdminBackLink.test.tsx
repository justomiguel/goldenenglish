import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminBackLink } from "@/components/dashboard/AdminBackLink";

describe("AdminBackLink", () => {
  it("is a primary link", () => {
    render(<AdminBackLink href="/es/dashboard/admin/users">Back</AdminBackLink>);
    const link = screen.getByRole("link", { name: "Back" });
    expect(link).toHaveAttribute("href", "/es/dashboard/admin/users");
    expect(link.className).toContain("--color-primary");
    expect(link.className).not.toContain("--color-secondary");
  });
});
