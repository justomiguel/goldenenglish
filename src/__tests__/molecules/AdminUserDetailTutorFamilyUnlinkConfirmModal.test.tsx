/** @vitest-environment jsdom */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminUserDetailTutorFamilyUnlinkConfirmModal } from "@/components/molecules/AdminUserDetailTutorFamilyUnlinkConfirmModal";
import { dictEn } from "@/test/dictEn";

describe("AdminUserDetailTutorFamilyUnlinkConfirmModal", () => {
  const labels = dictEn.admin.users;

  const target = {
    studentId: "00000000-0000-4000-8000-0000000000aa",
    displayName: "Pérez Ana",
    emailDisplay: "ana@school.test",
    relationshipCode: "mother" as string | null,
    isMinor: false,
    financialAccessActive: false,
  };

  it("shows confirm title when open with a student target", () => {
    render(
      <AdminUserDetailTutorFamilyUnlinkConfirmModal
        labels={labels}
        unlinkTarget={target}
        unlinkBusy={false}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    expect(screen.getByRole("heading", { name: labels.detailTutorFamilyUnlinkConfirmTitle })).toBeInTheDocument();
    expect(screen.getByText(`${target.displayName} — ${target.emailDisplay}`)).toBeInTheDocument();
  });

  it("invokes onConfirm when user confirms", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <AdminUserDetailTutorFamilyUnlinkConfirmModal
        labels={labels}
        unlinkTarget={target}
        unlinkBusy={false}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
      />,
    );
    await user.click(screen.getByRole("button", { name: labels.detailTutorFamilyUnlinkStudent }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
