import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminPwaTabBar } from "@/components/dashboard/AdminPwaTabBar";
import { AdminMobileShellProvider } from "@/components/dashboard/AdminMobileShellContext";
import type { Dictionary } from "@/types/i18n";

const pathname = vi.hoisted(() => ({ value: "/es/dashboard/admin/students" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.value,
}));

const dict = {
  pwaTabBarAria: "Quick admin navigation",
  pwaTabHome: "Home",
  pwaTabRegistrations: "Admissions",
  pwaTabFinance: "Finance",
  pwaTabPeople: "People",
  pwaTabMore: "More",
} as Dictionary["dashboard"]["adminNav"];

function renderBar(counts?: { registrations?: number; messages?: number }) {
  return render(
    <AdminMobileShellProvider>
      <AdminPwaTabBar
        locale="es"
        dict={dict}
        newRegistrationsCount={counts?.registrations ?? 0}
        recentInboundMessagesCount={counts?.messages ?? 0}
      />
    </AdminMobileShellProvider>,
  );
}

describe("AdminPwaTabBar", () => {
  it("marks the people tab on a students route and shows a capped admissions badge", () => {
    pathname.value = "/es/dashboard/admin/students";
    renderBar({ registrations: 120, messages: 2 });

    expect(screen.getByRole("navigation", { name: "Quick admin navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "People" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Admissions/ })).toHaveTextContent("99+");
    expect(screen.getByRole("button", { name: /More/ })).toHaveTextContent("2");
  });

  it("opens the shared drawer from the more tab", async () => {
    const user = userEvent.setup();
    pathname.value = "/es/dashboard/admin";
    renderBar();
    const more = screen.getByRole("button", { name: "More" });
    expect(more).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    await user.click(more);
    expect(more).toHaveAttribute("aria-expanded", "true");
  });
});
