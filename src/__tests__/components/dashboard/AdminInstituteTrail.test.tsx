import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { AdminInstituteTrail } from "@/components/dashboard/AdminInstituteTrail";

const navState = vi.hoisted(() => ({ pathname: "/en/dashboard/admin/events" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navState.pathname,
}));

describe("AdminInstituteTrail", () => {
  it("shows Instituto → Events on an Instituto child", () => {
    navState.pathname = "/en/dashboard/admin/events";
    render(<AdminInstituteTrail locale="en" dict={dictEn.dashboard.adminNav} />);
    expect(screen.getByRole("link", { name: dictEn.dashboard.adminNav.institute })).toHaveAttribute(
      "href",
      "/en/dashboard/admin/institute",
    );
    expect(screen.getByText(dictEn.dashboard.adminNav.events)).toBeInTheDocument();
  });

  it("hides on a daily destination", () => {
    navState.pathname = "/en/dashboard/admin/students";
    const { container } = render(<AdminInstituteTrail locale="en" dict={dictEn.dashboard.adminNav} />);
    expect(container).toBeEmptyDOMElement();
  });
});
