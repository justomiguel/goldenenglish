import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { mockPathname } from "@/test/navigationMock";
import { AdminSectionSubnav } from "@/components/dashboard/AdminSectionSubnav";

describe("AdminSectionSubnav", () => {
  it("marks the active item for the current path", () => {
    mockPathname.mockReturnValue("/es/dashboard/admin/users");
    const items = [
      { href: "/es/dashboard/admin/users", label: dictEn.admin.usersNav.list },
      { href: "/es/dashboard/admin/users/new", label: dictEn.admin.usersNav.add },
    ];
    render(
      <AdminSectionSubnav ariaLabel={dictEn.admin.usersNav.aria} items={items} />,
    );
    const listLink = screen.getByRole("link", { name: dictEn.admin.usersNav.list });
    expect(listLink.className).toMatch(/bg-\[var\(--color-primary\)\]/);
  });
});
