/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminUserDetailTutorCreateModal } from "@/components/molecules/AdminUserDetailTutorCreateModal";
import { dictEn } from "@/test/dictEn";

const linkMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/[locale]/dashboard/admin/users/adminUserDetailActions", () => ({
  createAdminParentAndLinkStudentAction: linkMock,
}));

const labels = dictEn.admin.users;

describe("AdminUserDetailTutorCreateModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    linkMock.mockResolvedValue({ ok: true, message: "ok" });
  });

  async function fillMinimumAndSubmit(user: Awaited<ReturnType<typeof userEvent.setup>>) {
    await user.type(screen.getByLabelText(labels.detailTutorCreateDni), "12345678-9");
    await user.type(screen.getByLabelText(labels.detailTutorCreateLastName), "Pérez");
    await user.type(screen.getByLabelText(labels.detailTutorCreateFirstName), "Ana");
    await user.selectOptions(
      screen.getByRole("combobox", { name: labels.detailTutorCreateRelationship }),
      "mother",
    );
    await user.click(screen.getByRole("button", { name: labels.detailTutorCreateSubmit }));
  }

  it("shows action error inside the modal and does not call onFeedback(false)", async () => {
    const user = userEvent.setup();
    const onFeedback = vi.fn();
    linkMock.mockResolvedValueOnce({ ok: false, message: "Inline failure detail" });

    render(
      <AdminUserDetailTutorCreateModal
        open
        onOpenChange={vi.fn()}
        locale="en"
        studentId="stu-1"
        labels={labels}
        onFeedback={onFeedback}
        onLinked={vi.fn()}
      />,
    );

    await fillMinimumAndSubmit(user);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Inline failure detail");
    });
    expect(onFeedback).not.toHaveBeenCalled();
  });

  it("shows validation error inside the modal when relationship is missing", async () => {
    const user = userEvent.setup();
    const onFeedback = vi.fn();

    render(
      <AdminUserDetailTutorCreateModal
        open
        onOpenChange={vi.fn()}
        locale="en"
        studentId="stu-1"
        labels={labels}
        onFeedback={onFeedback}
        onLinked={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText(labels.detailTutorCreateDni), "12345678-9");
    await user.type(screen.getByLabelText(labels.detailTutorCreateLastName), "Pérez");
    await user.type(screen.getByLabelText(labels.detailTutorCreateFirstName), "Ana");
    await user.click(screen.getByRole("button", { name: labels.detailTutorCreateSubmit }));

    expect(screen.getByRole("alert")).toHaveTextContent(labels.detailErrTutorRelationshipRequired);
    expect(onFeedback).not.toHaveBeenCalled();
    expect(linkMock).not.toHaveBeenCalled();
  });
});
