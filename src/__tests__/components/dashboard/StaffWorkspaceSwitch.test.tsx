import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StaffWorkspaceSwitch } from "@/components/dashboard/StaffWorkspaceSwitch";
import { dictEn } from "@/test/dictEn";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/dashboard/viewAsActions", () => ({
  clearViewAsAction: vi.fn(async () => ({ href: "/en/dashboard/admin" })),
  openOwnTeacherAction: vi.fn(async () => ({ href: "/en/dashboard/teacher" })),
  searchViewAsPeopleAction: vi.fn(async () => ({ rows: [] })),
  startViewAsAction: vi.fn(async () => ({ href: "/en/dashboard/student", started: true })),
}));

describe("StaffWorkspaceSwitch", () => {
  it("opens role options including student, staff, and all", async () => {
    const user = userEvent.setup();
    render(
      <StaffWorkspaceSwitch locale="en" dict={dictEn} activeRole="admin" viewAs={null} />,
    );
    await user.click(screen.getByRole("button", { name: dictEn.dashboard.viewAs.ariaSelector }));
    expect(screen.getByRole("option", { name: dictEn.dashboard.adminChrome.workspaceAdmin })).toBeTruthy();
    expect(screen.getByRole("option", { name: dictEn.dashboard.adminChrome.workspaceTeacher })).toBeTruthy();
    expect(screen.getByRole("option", { name: dictEn.admin.users.roleOptionStudent })).toBeTruthy();
    expect(screen.getByRole("option", { name: dictEn.admin.users.roleOptionAssistant })).toBeTruthy();
    expect(screen.getByRole("option", { name: dictEn.admin.users.roleFilterAll })).toBeTruthy();
  });

  it("portals the open menu to document.body so overflow-hidden chrome cannot clip it", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <div className="overflow-hidden" style={{ height: 64 }}>
        <StaffWorkspaceSwitch locale="en" dict={dictEn} activeRole="admin" viewAs={null} />
      </div>,
    );
    await user.click(screen.getByRole("button", { name: dictEn.dashboard.viewAs.ariaSelector }));
    const listbox = screen.getByRole("listbox");
    expect(container.contains(listbox)).toBe(false);
    expect(document.body.contains(listbox)).toBe(true);
  });

  it("shows my teaching area with the teacher-portal tour hook", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <StaffWorkspaceSwitch locale="en" dict={dictEn} activeRole="admin" viewAs={null} />,
    );
    await user.click(screen.getByRole("button", { name: dictEn.dashboard.viewAs.ariaSelector }));
    await user.click(screen.getByRole("option", { name: dictEn.dashboard.adminChrome.workspaceTeacher }));
    expect(screen.getByRole("button", { name: dictEn.dashboard.viewAs.ownTeacher })).toBeTruthy();
    expect(container.querySelector('[data-tour="admin-chrome-teacher-portal"]')).not.toBeNull();
  });
});
