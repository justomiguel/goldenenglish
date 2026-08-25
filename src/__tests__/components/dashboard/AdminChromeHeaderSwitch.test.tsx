import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminChromeHeader } from "@/components/dashboard/AdminChromeHeader";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/dashboard/admin",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt?: string }) => <img alt={alt ?? ""} />,
}));

vi.mock("@/lib/dashboard/viewAsActions", () => ({
  clearViewAsAction: vi.fn(async () => ({ href: "/en/dashboard/admin" })),
  openOwnTeacherAction: vi.fn(async () => ({ href: "/en/dashboard/teacher" })),
  searchViewAsPeopleAction: vi.fn(async () => ({ rows: [] })),
  startViewAsAction: vi.fn(async () => ({ href: "/en/dashboard/student", started: true })),
}));

describe("AdminChromeHeader workspace switch", () => {
  it("renders the role selector and the teacher-portal tour hook", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AdminChromeHeader
        locale="en"
        brand={mockBrandPublic}
        dict={dictEn}
        adminProfileRole="admin"
        teacherPortalAllowed
        compactBrand
        newRegistrationsCount={0}
        recentInboundMessagesCount={0}
      />,
    );
    await user.click(screen.getByRole("button", { name: dictEn.dashboard.viewAs.ariaSelector }));
    await user.click(screen.getByRole("option", { name: dictEn.dashboard.adminChrome.workspaceTeacher }));
    expect(container.querySelector('[data-tour="admin-chrome-teacher-portal"]')).not.toBeNull();
  });

  it("does not render the language switcher on the admin chrome", () => {
    render(
      <AdminChromeHeader
        locale="en"
        brand={mockBrandPublic}
        dict={dictEn}
        adminProfileRole="admin"
        teacherPortalAllowed
        compactBrand
        newRegistrationsCount={0}
        recentInboundMessagesCount={0}
      />,
    );
    expect(screen.queryByRole("navigation", { name: dictEn.common.locale.label })).toBeNull();
    expect(screen.queryByRole("link", { name: dictEn.dashboard.adminChrome.backToSite })).not.toBeNull();
  });
});
