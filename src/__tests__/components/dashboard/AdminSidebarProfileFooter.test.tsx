import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { AdminSidebarProfileFooter } from "@/components/dashboard/AdminSidebarProfileFooter";

describe("AdminSidebarProfileFooter", () => {
  it("shows the logged-in person's name under the avatar, not only the role", () => {
    render(
      <AdminSidebarProfileFooter
        locale="en"
        dict={dictEn}
        displayName="María García"
        roleLabel="Admin"
        avatarUrl={null}
      />,
    );

    expect(screen.getByText("María García")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/en/dashboard/profile");
  });

  it("shows the profile photo when one exists", () => {
    render(
      <AdminSidebarProfileFooter
        locale="en"
        dict={dictEn}
        displayName="María García"
        roleLabel="Admin"
        avatarUrl="https://cdn.example/maria.jpg"
      />,
    );

    expect(screen.getByRole("img")).toHaveAttribute("src", "https://cdn.example/maria.jpg");
  });
});
