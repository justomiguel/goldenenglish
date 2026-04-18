import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { mockPathname } from "@/test/navigationMock";
import { StudentSidebarNavContent } from "@/components/dashboard/StudentSidebarNavContent";

const navDict = dictEn.dashboard.studentNav;

describe("StudentSidebarNavContent", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/es/dashboard/student");
  });

  // REGRESSION CHECK: Active route highlight must match the current pathname so the user
  // always knows which section is open; covers exact-match (home) vs prefix-match (subroutes).
  it("marks the home item as active on the base route and switches when the path changes", () => {
    const { rerender } = render(
      <StudentSidebarNavContent locale="es" dict={navDict} />,
    );
    const home = screen.getByRole("link", { name: navDict.home });
    expect(home.className).toContain("border-[var(--color-primary)]");

    mockPathname.mockReturnValue("/es/dashboard/student/payments/123");
    rerender(<StudentSidebarNavContent locale="es" dict={navDict} />);
    const payments = screen.getByRole("link", { name: navDict.payments });
    expect(payments.className).toContain("border-[var(--color-primary)]");
    expect(screen.getByRole("link", { name: navDict.home }).className).toContain("border-transparent");
  });

  it("renders all primary groups with their tooltips", () => {
    render(<StudentSidebarNavContent locale="en" dict={navDict} />);
    expect(screen.getByText(navDict.navScopeStudent)).toBeInTheDocument();
    expect(screen.getByText(navDict.groupLearning)).toBeInTheDocument();
    expect(screen.getByText(navDict.groupFinance)).toBeInTheDocument();
    expect(screen.getByText(navDict.groupComms)).toBeInTheDocument();
    expect(screen.getByText(navDict.groupYou)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: navDict.calendar })).toHaveAttribute(
      "title",
      navDict.tipCalendar,
    );
  });
});
