/** @vitest-environment jsdom */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminUserDetailTutorFamilyLinkStudentsPanel } from "@/components/molecules/AdminUserDetailTutorFamilyLinkStudentsPanel";
import { dictEn } from "@/test/dictEn";

vi.mock("@/components/molecules/StaffSearchComboboxWithChipQueue", () => ({
  StaffSearchComboboxWithChipQueue: () => <div data-testid="staff-search-mock" />,
}));

vi.mock("@/components/molecules/AdminUserDetailTutorRelationshipSelect", () => ({
  AdminUserDetailTutorRelationshipSelect: () => <div data-testid="relationship-select-mock" />,
}));

const labels = dictEn.admin.users;

describe("AdminUserDetailTutorFamilyLinkStudentsPanel", () => {
  const baseProps = {
    labels,
    relationship: "" as const,
    onRelationshipChange: vi.fn(),
    busy: false,
    search: vi.fn().mockResolvedValue([]),
    onPick: vi.fn(),
    fieldResetKey: 0,
    linkedStudentIds: [] as readonly string[],
    queue: [],
    onRemoveFromQueue: vi.fn(),
    onSave: vi.fn(),
  };

  it("shows hide control when guardian already has linked students", async () => {
    const user = userEvent.setup();
    const onHide = vi.fn();
    render(<AdminUserDetailTutorFamilyLinkStudentsPanel {...baseProps} hasLinkedStudents onHide={onHide} />);
    await user.click(screen.getByRole("button", { name: labels.detailTutorFamilyHideLinkStudentsPanel }));
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it("omits hide control when no linked students yet", () => {
    render(<AdminUserDetailTutorFamilyLinkStudentsPanel {...baseProps} hasLinkedStudents={false} onHide={vi.fn()} />);
    expect(screen.queryByRole("button", { name: labels.detailTutorFamilyHideLinkStudentsPanel })).not.toBeInTheDocument();
  });
});
